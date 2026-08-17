import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer as createViteServer } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const dataDirectory = path.join(root, "data");
const filesDirectory = path.join(dataDirectory, "files");
const itemsFile = path.join(dataDirectory, "items.json");
const items = [];

await mkdir(filesDirectory, { recursive: true });
try {
  const savedItems = JSON.parse(await readFile(itemsFile, "utf8"));
  if (Array.isArray(savedItems)) items.push(...savedItems);
} catch (error) {
  if (error.code !== "ENOENT") console.error("读取共享内容失败:", error);
}

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function saveItems() {
  const temporaryFile = `${itemsFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(items, null, 2), "utf8");
  await rename(temporaryFile, itemsFile);
}

async function removeFile(item) {
  if (item.kind === "text") return;
  try {
    await unlink(path.join(filesDirectory, item.id));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function bodyOf(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body);
}

function decodeData(data) {
  const match = /^data:([^;,]+)?;base64,(.*)$/s.exec(data || "");
  if (!match) throw new Error("无效的文件内容");
  return { mime: match[1] || "application/octet-stream", buffer: Buffer.from(match[2], "base64") };
}

function accessAddresses(port) {
  const virtualInterface = /^(awdl|bridge|docker|llw|tap|tun|utun|veth|vmnet)/i;
  const privateAddress = (address) => {
    const parts = address.split(".").map(Number);
    return parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
  };
  return Object.entries(networkInterfaces())
    .flatMap(([interfaceName, addresses]) => (addresses || []).map((entry) => ({ interfaceName, entry })))
    .filter(({ interfaceName, entry }) => entry.family === "IPv4" && !entry.internal && privateAddress(entry.address) && !virtualInterface.test(interfaceName))
    .sort((left, right) => Number(!/^en\d+$/.test(left.interfaceName)) - Number(!/^en\d+$/.test(right.interfaceName)))
    .map(({ interfaceName, entry }) => ({ interface: interfaceName, address: entry.address, url: `http://${entry.address}:${port}` }));
}

async function serveFile(response, item, headOnly = false) {
  const filePath = path.join(filesDirectory, item.id);
  try {
    const fileStats = await stat(filePath);
    response.writeHead(200, {
      "Content-Type": item.mime || "application/octet-stream",
      "Content-Length": fileStats.size,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(item.name || "shared-file")}`,
      "Cache-Control": "no-cache",
    });
    if (!headOnly) createReadStream(filePath).pipe(response);
    else response.end();
  } catch (error) {
    if (error.code === "ENOENT") json(response, 404, { error: "文件不存在" });
    else json(response, 500, { error: "读取文件失败" });
  }
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/access" && request.method === "GET") {
    const addresses = accessAddresses(port);
    return json(response, 200, { url: addresses[0]?.url || null, addresses });
  }
  if (url.pathname.startsWith("/api/files/") && (request.method === "GET" || request.method === "HEAD")) {
    const id = decodeURIComponent(url.pathname.slice("/api/files/".length));
    const item = items.find((currentItem) => currentItem.id === id && currentItem.kind !== "text");
    if (!item) return json(response, 404, { error: "文件不存在" });
    return serveFile(response, item, request.method === "HEAD");
  }

  if (url.pathname === "/api/items" && request.method === "GET") return json(response, 200, items);

  if (url.pathname === "/api/items" && request.method === "POST") {
    return bodyOf(request).then(async (body) => {
      if (!body.kind || (body.kind === "text" && !body.text) || (body.kind !== "text" && !body.data)) {
        return json(response, 400, { error: "内容不完整" });
      }

      const id = crypto.randomUUID();
      const item = { id, kind: body.kind, text: body.text, name: body.name, size: body.size, mime: body.mime, source: body.source, createdAt: Date.now() };
      if (body.kind !== "text") {
        const decoded = decodeData(body.data);
        item.mime = item.mime || decoded.mime;
        await writeFile(path.join(filesDirectory, id), decoded.buffer);
        item.url = `/api/files/${id}`;
      }
      items.unshift(item);
      const removedItems = items.splice(80);
      await Promise.all(removedItems.map(removeFile));
      await saveItems();
      return json(response, 201, item);
    }).catch(() => json(response, 400, { error: "无法保存内容" }));
  }

  if (url.pathname === "/api/items" && request.method === "DELETE") {
    if (!url.searchParams.has("id")) {
      const removedItems = items.splice(0);
      await Promise.all(removedItems.map(removeFile));
      await saveItems();
      return json(response, 200, { ok: true });
    }

    const index = items.findIndex((item) => item.id === url.searchParams.get("id"));
    if (index >= 0) {
      const [removedItem] = items.splice(index, 1);
      await removeFile(removedItem);
      await saveItems();
    }
    return json(response, 200, { ok: true });
  }
  return false;
}

const vite = await createViteServer({ root, server: { middlewareMode: true, hmr: true }, appType: "spa" });
const server = createServer((request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    Promise.resolve(handleApi(request, response, url)).then((handled) => {
      if (handled === false) json(response, 404, { error: "Not found" });
    }).catch(() => json(response, 500, { error: "服务器错误" }));
    return;
  }
  vite.middlewares(request, response, (error) => {
    if (error) { response.statusCode = 500; response.end(error.stack); }
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, "0.0.0.0", () => {
  console.log(`局域网投递板已启动: http://localhost:${port}`);
  console.log("同一 Wi-Fi 下的设备请访问这台机器的局域网 IP + 端口");
});
