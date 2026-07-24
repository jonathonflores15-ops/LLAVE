import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { api } from "./api.js";

const C = {
  ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E",
  sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", coral: "#E2674B", white: "#FFFFFF",
};

const T = {
  es: { title: "Asistente Llave", placeholder: "Ej. Alquiler en Ponce bajo $1,500", send: "Enviar",
    greeting: "¡Hola! Puedo ayudarte a encontrar propiedades o responder preguntas sobre Llave.",
    err: "No se pudo conectar con el asistente. Intenta de nuevo.",
    unavailable: "El asistente no está disponible en este momento.",
    limited: "Demasiadas preguntas seguidas — espera un momento." },
  en: { title: "Llave Assistant", placeholder: "E.g. Rentals in Ponce under $1,500", send: "Send",
    greeting: "Hi! I can help you find properties or answer questions about Llave.",
    err: "Couldn't reach the assistant. Try again.",
    unavailable: "The assistant isn't available right now.",
    limited: "Too many questions in a row — wait a moment." },
};

export default function Assistant({ lang, onApplyFilters }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput(""); setBusy(true);
    try {
      const r = await api.assistant(msg);
      setMessages((m) => [...m, { role: "assistant", text: r.reply }]);
      if (r.filters && onApplyFilters) onApplyFilters(r.filters);
    } catch (e) {
      const code = e?.status;
      const text = code === 503 ? t.unavailable : code === 429 ? t.limited : t.err;
      setMessages((m) => [...m, { role: "assistant", text, isErr: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-label={t.title}
        style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60, width: 56, height: 56, borderRadius: "50%", background: C.coral, color: "#fff", border: "none", boxShadow: "0 8px 24px -8px rgba(0,0,0,.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div style={{ position: "fixed", right: 20, bottom: 86, zIndex: 60, width: 340, maxWidth: "calc(100vw - 40px)", height: 440, maxHeight: "calc(100vh - 140px)", background: C.white, borderRadius: 16, border: `1px solid ${C.seaLine}`, boxShadow: "0 20px 50px -12px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: C.teal, color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Sparkles size={16} /><b style={{ fontSize: 14 }}>{t.title}</b>
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ alignSelf: "flex-start", background: C.sand, color: C.ink, padding: "8px 12px", borderRadius: 12, fontSize: 13, maxWidth: "85%" }}>{t.greeting}</div>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? C.teal : (m.isErr ? "#FBEDE7" : C.sand),
                color: m.role === "user" ? "#fff" : (m.isErr ? "#A9401F" : C.ink),
                padding: "8px 12px", borderRadius: 12, fontSize: 13, maxWidth: "85%", whiteSpace: "pre-wrap",
              }}>{m.text}</div>
            ))}
            {busy && <div style={{ alignSelf: "flex-start", color: C.sea, fontSize: 12 }}>···</div>}
          </div>
          <div style={{ display: "flex", gap: 6, padding: 10, borderTop: `1px solid ${C.seaLine}`, flexShrink: 0 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.placeholder}
              style={{ flex: 1, border: `1px solid ${C.seaLine}`, borderRadius: 10, padding: "9px 11px", fontSize: 13, minWidth: 0 }} />
            <button onClick={send} disabled={busy} style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 10, width: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
