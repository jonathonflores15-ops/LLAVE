import React, { useState, useEffect } from "react";
import Home from "./Home.jsx";
import Report from "./Report.jsx";
import Account from "./Account.jsx";
import Auth from "./Auth.jsx";
import Publish from "./Publish.jsx";
import Admin from "./Admin.jsx";
import { api, getToken, setToken } from "./api.js";

function parsePath(pathname) {
  if (pathname === "/admin") return { view: "admin" };
  if (pathname === "/cuenta") return { view: "account" };
  if (pathname === "/publicar") return { view: "publish" };
  const m = pathname.match(/^\/propiedad\/([^/]+)\/?$/);
  if (m) return { view: "report", catastro: decodeURIComponent(m[1]) };
  return { view: "home" };
}

const initial = parsePath(window.location.pathname);
if (window.location.hash === "#admin") initial.view = "admin"; // legacy bookmark support

export default function App() {
  const [lang, setLang] = useState("es");
  const [view, setView] = useState(initial.view);
  const [catastro, setCatastro] = useState(initial.catastro || "040-088-201-05-012");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (getToken()) api.me().then((d) => setUser(d.user)).catch(() => setToken(null));
    if (window.location.hash === "#admin") history.replaceState(null, "", "/admin");
  }, []);

  useEffect(() => {
    const onPop = () => {
      const p = parsePath(window.location.pathname);
      setView(p.view);
      if (p.catastro) setCatastro(p.catastro);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = (path, nextView, cat) => {
    history.pushState(null, "", path);
    setView(nextView);
    if (cat) setCatastro(cat);
    window.scrollTo(0, 0);
  };

  const open = (cat) => go(`/propiedad/${encodeURIComponent(cat)}`, "report", cat);
  const goHome = () => go("/", "home");
  const goAccount = () => go("/cuenta", "account");
  const goPublish = () => go("/publicar", "publish");
  const logout = () => { setToken(null); setUser(null); goHome(); };

  const shared = { lang, setLang, user, setUser, onLogin: () => setAuthOpen(true), onLogout: logout };

  let screen;
  if (view === "report") screen = <Report {...shared} catastro={catastro} onBack={goHome} />;
  else if (view === "account") screen = <Account {...shared} onBack={goHome} onOpen={open} />;
  else if (view === "publish") screen = <Publish lang={lang} setLang={setLang} onBack={goHome} />;
  else if (view === "admin") screen = <Admin onBack={goHome} />;
  else screen = <Home {...shared} onOpen={open} onAccount={goAccount} onPublish={goPublish} />;

  return (
    <>
      {screen}
      {authOpen && (
        <Auth lang={lang} onClose={() => setAuthOpen(false)} onSuccess={(u) => { setUser(u); setAuthOpen(false); }} />
      )}
    </>
  );
}
