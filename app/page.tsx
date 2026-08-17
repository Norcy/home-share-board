"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { ArrowRight, Copy, Download, File, Image as ImageIcon, Paperclip, QrCode, Trash2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type AccessInfo = {
  url: string | null;
};

type ShareItem = {
  id: string;
  kind: "text" | "file" | "image";
  text?: string;
  name?: string;
  size?: number;
  mime?: string;
  data?: string;
  url?: string;
  source?: string;
  createdAt: number;
};

type CardAction = {
  label: string;
  icon: ReactNode;
  tone?: "danger";
  onClick: () => void;
};

function CardActions({ actions }: { actions: CardAction[] }) {
  return <div className="card-actions">{actions.map((action) => <button className={`card-action${action.tone === "danger" ? " is-danger" : ""}`} type="button" title={action.label} aria-label={action.label} key={action.label} onClick={(event) => { event.stopPropagation(); action.onClick(); }}>{action.icon}</button>)}</div>;
}

function CardFooter({ children, actions }: { children: ReactNode; actions: CardAction[] }) {
  return <div className="card-footer"><div className="card-footer-content">{children}</div><CardActions actions={actions} /></div>;
}

const formatSize = (bytes = 0) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day} ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
};

const deviceName = () => {
  if (typeof navigator === "undefined") return "设备";
  const userAgent = navigator.userAgent;
  if (/iPad/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  return "设备";
};

const isPrivateHostname = (hostname: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);

export default function Home() {
  const [items, setItems] = useState<ShareItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<ShareItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const initialAccessUrl = typeof window !== "undefined" && isPrivateHostname(window.location.hostname) ? window.location.origin : null;
  const [accessUrl, setAccessUrl] = useState<string | null>(initialAccessUrl);
  const [accessChecked, setAccessChecked] = useState(Boolean(initialAccessUrl));
  const [showAccess, setShowAccess] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

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
    if (initialAccessUrl) return;
    fetch("/api/access", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<AccessInfo> : Promise.reject())
      .then((access) => setAccessUrl(access.url))
      .catch(() => setAccessUrl(null))
      .finally(() => setAccessChecked(true));
  }, [initialAccessUrl, loadItems]);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.addEventListener("change", () => void loadItems());
    return () => events.close();
  }, [loadItems]);

  useEffect(() => {
    if (!showAccess) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowAccess(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showAccess]);

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
      body: JSON.stringify({ kind: "text", text: draft.trim(), source: deviceName() }),
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
        body: JSON.stringify({ kind: file.type.startsWith("image/") ? "image" : "file", name: file.name, size: file.size, mime: file.type, data, source: deviceName() }),
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
    if (!item.url) return;
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name || "lan-share-file";
    link.click();
  };

  const clearItems = async () => {
    if (!window.confirm("清空全部共享内容？")) return;
    await fetch("/api/items", { method: "DELETE" });
    await loadItems();
  };

  const deleteItem = async (item: ShareItem) => {
    const previousItems = items;
    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
    try {
      const response = await fetch(`/api/items?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (response.ok) {
        showNotice("已删除");
      } else {
        setItems(previousItems);
        showNotice("删除失败，请重试");
      }
    } catch {
      setItems(previousItems);
      showNotice("删除失败，请重试");
    }
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

  const actionsFor = (item: ShareItem): CardAction[] => [
    { label: "删除", icon: <Trash2 size={12} />, tone: "danger", onClick: () => void deleteItem(item) },
    item.kind === "text"
      ? { label: "复制", icon: <Copy size={12} />, onClick: () => void copyText(item.text || "") }
      : { label: "下载", icon: <Download size={12} />, onClick: () => download(item) },
  ];

  const renderItem = (item: ShareItem) => item.kind === "text" ? <article className="item-card text-card" key={item.id} onClick={() => void copyText(item.text || "")}><p className="item-text">{item.text}</p><CardFooter actions={actionsFor(item)}><span className="card-details"><span>{item.source || "设备"}</span><span aria-hidden="true">·</span><span>{formatTime(item.createdAt)}</span></span></CardFooter></article> : <article className={`item-card ${item.kind}-card`} key={item.id}>
    {item.kind === "image" ? <img className="item-image" src={item.url} alt={item.name || "共享图片"} onClick={() => setPreview(item)} /> : <div className="file-heading"><span className="file-icon"><File size={18} /></span><strong className="file-name">{item.name}</strong></div>}
    <CardFooter actions={actionsFor(item)}>{item.kind === "image" && <strong>{item.name}</strong>}<span>{formatSize(item.size)} · {item.kind === "file" ? `${item.mime || "文件"} · ` : ""}{item.source || "设备"} · {formatTime(item.createdAt)}</span></CardFooter>
  </article>;

  return (
    <main className={`shell${dragging ? " is-dragging" : ""}`}>
      <div className="sticky-header">
        <header className="topbar">
          <div className="brand"><span className="brand-mark">↗</span><span>我家的共享桌面</span></div>
          <div className="topbar-actions"><button className="clear-button" type="button" title="清空" aria-label="清空" onClick={() => void clearItems()}><Trash2 size={14} /></button><button className="qr-button" type="button" title="手机扫码访问" aria-label="手机扫码访问" aria-expanded={showAccess} onClick={() => setShowAccess(true)}><QrCode size={15} /></button></div>
        </header>

        <section className="composer">
          <div className={`composer-box${dragging ? " is-dragging" : ""}`}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) && !event.nativeEvent.isComposing) { event.preventDefault(); void sendText(); } }} placeholder="输入文字或拖入图片" />
            <div className="composer-actions"><div className="action-row"><button className="file-button" type="button" title="添加文件或图片" onClick={() => fileInput.current?.click()}><Paperclip size={20} strokeWidth={1.8} /></button><button className="file-button gallery-button" type="button" title="从相册选择" onClick={() => galleryInput.current?.click()}><ImageIcon size={20} strokeWidth={1.8} /></button><input ref={fileInput} type="file" multiple hidden onChange={(event) => event.target.files && void sendFiles(event.target.files)} /><input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={(event) => event.target.files && void sendFiles(event.target.files)} /><button className="send-button" type="button" title="发送" onClick={() => void sendText()} disabled={!draft.trim() || sending}>{sending ? "…" : <ArrowRight size={21} strokeWidth={2.2} />}</button></div></div>
          </div>
        </section>
      </div>

      {loading ? <div className="empty-state"><div className="spinner" /><p>正在连接共享板…</p></div> : items.length > 0 && <>
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

      {showAccess && <div className="access-backdrop" role="presentation" onClick={() => setShowAccess(false)}><section className="access-dialog" role="dialog" aria-modal="true" aria-label="手机扫码访问" onClick={(event) => event.stopPropagation()}><button className="access-close" type="button" title="关闭" aria-label="关闭" onClick={() => setShowAccess(false)}><X size={16} /></button>{accessUrl ? <><div className="access-qr"><QRCodeSVG value={accessUrl} size={184} level="M" marginSize={1} title="手机访问共享桌面" /></div><div className="access-details"><strong>手机扫码访问</strong><span>连接同一 Wi‑Fi，用相机扫描二维码</span><button type="button" onClick={() => void copyText(accessUrl)}>{accessUrl}</button></div></> : <div className="access-details"><strong>手机扫码访问</strong><span>{accessChecked ? "未检测到局域网地址，请确认已连接 Wi‑Fi" : "正在检测局域网地址…"}</span></div>}</section></div>}
      {notice && <div className="toast">{notice}</div>}
      {preview && <div className="lightbox" onClick={() => setPreview(null)}><img src={preview.url} alt={preview.name || "预览图片"} /></div>}
    </main>
  );
}
