"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { ArrowRight, Download, Paperclip, Trash2 } from "lucide-react";

type ShareItem = {
  id: string;
  kind: "text" | "file" | "image";
  text?: string;
  name?: string;
  size?: number;
  mime?: string;
  data?: string;
  createdAt: number;
};

const formatSize = (bytes = 0) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function Home() {
  const [items, setItems] = useState<ShareItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<ShareItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await fetch("/api/items", { cache: "no-store" });
      if (response.ok) setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const sendText = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "text", text: draft.trim() }),
    });
    if (response.ok) {
      setDraft("");
      await loadItems();
      showNotice("已放到共享板");
    }
    setSending(false);
  };

  const sendFiles = useCallback(async (files: FileList | File[]) => {
    setSending(true);
    for (const file of Array.from(files)) {
      if (file.size > 12 * 1024 * 1024) {
        showNotice(`${file.name} 超过 12 MB，已跳过`);
        continue;
      }
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: file.type.startsWith("image/") ? "image" : "file", name: file.name, size: file.size, mime: file.type, data }),
      });
    }
    await loadItems();
    setSending(false);
    showNotice(files.length > 1 ? `已发送 ${files.length} 个文件` : "文件已放到共享板");
    if (fileInput.current) fileInput.current.value = "";
  }, [loadItems, showNotice]);

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      showNotice("已复制");
    } catch {
      showNotice("复制失败，请长按文字复制");
    }
  };

  const download = (item: ShareItem) => {
    if (!item.data) return;
    const link = document.createElement("a");
    link.href = item.data;
    link.download = item.name || "lan-share-file";
    link.click();
  };

  const clearItems = async () => {
    if (!window.confirm("清空全部共享内容？")) return;
    await fetch("/api/items", { method: "DELETE" });
    await loadItems();
  };

  useEffect(() => {
    let dragDepth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");
    const dragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth += 1;
      setDragging(true);
    };
    const dragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    };
    const dragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth -= 1;
      if (dragDepth <= 0) {
        dragDepth = 0;
        setDragging(false);
      }
    };
    const dropFiles = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth = 0;
      setDragging(false);
      if (event.dataTransfer.files.length) void sendFiles(event.dataTransfer.files);
    };
    window.addEventListener("dragenter", dragEnter, true);
    window.addEventListener("dragover", dragOver, true);
    window.addEventListener("dragleave", dragLeave, true);
    window.addEventListener("drop", dropFiles, true);
    return () => {
      window.removeEventListener("dragenter", dragEnter, true);
      window.removeEventListener("dragover", dragOver, true);
      window.removeEventListener("dragleave", dragLeave, true);
      window.removeEventListener("drop", dropFiles, true);
    };
  }, [sendFiles]);

  const textItems = items.filter((item) => item.kind === "text");
  const assetItems = items.filter((item) => item.kind !== "text");

  const renderItem = (item: ShareItem) => item.kind === "text" ? <article className="item-card text-card" key={item.id} onClick={() => void copyText(item.text || "")}><p className="item-text">{item.text}</p></article> : <article className={`item-card ${item.kind}-card`} key={item.id}>
    <div className="item-meta"><span className={`type-dot ${item.kind}`} /> <span>{item.kind === "image" ? "图片" : "文件"}</span></div>
    {item.kind === "image" ? <><img className="item-image" src={item.data} alt={item.name || "共享图片"} onClick={() => setPreview(item)} /><div className="file-footer"><div><strong>{item.name}</strong><span>{formatSize(item.size)}</span></div><button className="download-button" title="下载" onClick={() => download(item)}><Download size={16} /></button></div></> : <div className="file-row"><div className="file-icon">↘</div><div><strong>{item.name}</strong><span>{formatSize(item.size)} · {item.mime || "文件"}</span></div><button className="download-button" title="下载" onClick={() => download(item)}><Download size={16} /></button></div>}
  </article>;

  return (
    <main className={`shell${dragging ? " is-dragging" : ""}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">↗</span><span>我家的共享桌面</span></div>
      </header>

      <section className="composer">
        <div className={`composer-box${dragging ? " is-dragging" : ""}`}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendText(); } }} placeholder="输入文字或拖入图片" />
          <div className="composer-actions"><div className="action-row"><button className="file-button" type="button" title="添加文件或图片" onClick={() => fileInput.current?.click()}><Paperclip size={20} strokeWidth={1.8} /></button><input ref={fileInput} type="file" multiple hidden onChange={(event) => event.target.files && void sendFiles(event.target.files)} /><button className="send-button" type="button" title="发送" onClick={() => void sendText()} disabled={!draft.trim() || sending}>{sending ? "…" : <ArrowRight size={21} strokeWidth={2.2} />}</button></div></div>
        </div>
      </section>

      <div className="board-actions"><button className="clear-button" type="button" onClick={() => void clearItems()}><Trash2 size={15} /> 清空</button></div>
      {loading ? <div className="empty-state"><div className="spinner" /><p>正在连接共享板…</p></div> : items.length === 0 ? <div className="empty-state"><p>还没有共享内容</p></div> : <>
        <div className="content-columns">
        <section className="content-column">
          {textItems.map(renderItem)}
        </section>
        <section className="content-column">
          {assetItems.map(renderItem)}
        </section>
        </div>
        <div className="mobile-feed">{items.map(renderItem)}</div>
      </>}

      <footer><span>内容只保存在这台机器的运行内存中 · 手动刷新查看最新内容</span></footer>
      {notice && <div className="toast">{notice}</div>}
      {preview && <div className="lightbox" onClick={() => setPreview(null)}><img src={preview.data} alt={preview.name || "预览图片"} /></div>}
    </main>
  );
}
