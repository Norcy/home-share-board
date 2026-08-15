import { createServer as createViteServer } from "vite";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const items = [];

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function bodyOf(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body);
}

function handleApi(request, response, url) {
  if (url.pathname === "/api/items" && request.method === "GET") return json(response, 200, items);
  if (url.pathname === "/api/items" && request.method === "POST") {
    return bodyOf(request).then((body) => {
      if (!body.kind || (body.kind === "text" && !body.text) || (body.kind !== "text" && !body.data)) {
        return json(response, 400, { error: "内容不完整" });
      }
      const item = { id: crypto.randomUUID(), ...body, createdAt: Date.now() };
      items.unshift(item);
      items.splice(80);
      return json(response, 201, item);
    }).catch(() => json(response, 400, { error: "无法读取内容" }));
  }
  if (url.pathname === "/api/items" && request.method === "DELETE") {
    if (!url.searchParams.has("id")) {
      items.length = 0;
      return json(response, 200, { ok: true });
    }
    const index = items.findIndex((item) => item.id === url.searchParams.get("id"));
    if (index >= 0) items.splice(index, 1);
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
    });
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
