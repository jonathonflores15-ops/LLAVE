import React, { useState, useEffect } from "react";
import Home from "./Home.jsx";
import Report from "./Report.jsx";
import Account from "./Account.jsx";
import Auth from "./Auth.jsx";
import Publish from "./Publish.jsx";
import Admin from "./Admin.jsx";
import { api, getToken, setToken } from "./api.js";

export default function App() {
  const [lang, setLang] = useState("es");
  const [view, setView] = useState("home"); // home | report | account | publish | admin
  const [catastro, setCatastro] = useState("040-088-201-05-012");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (getToken()) api.me().then((d) => setUser(d.user)).catch(() => setToken(null));
    if (window.location.hash === "#admin") setView("admin");
  }, []);

  const open = (cat) => { setCatastro(cat); setView("report"); window.scrollTo(0, 0); };
  const goHome = () => { setView("home"); window.scrollTo(0, 0); if (window.location.hash) history.replaceState(null, "", "/"); };
  const goAccount = () => { setView("account"); window.scrollTo(0, 0); };
  const goPublish = () => { setView("publish"); window.scrollTo(0, 0); };
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
