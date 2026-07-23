import React, { useState, useEffect } from "react";
import Home from "./Home.jsx";
import Report from "./Report.jsx";
import Account from "./Account.jsx";
import Auth from "./Auth.jsx";
import { api, getToken, setToken } from "./api.js";

export default function App() {
  const [lang, setLang] = useState("es");
  const [view, setView] = useState("home"); // home | report | account
  const [catastro, setCatastro] = useState("040-088-201-05-012");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (getToken()) api.me().then((d) => setUser(d.user)).catch(() => setToken(null));
  }, []);

  const open = (cat) => { setCatastro(cat); setView("report"); window.scrollTo(0, 0); };
  const goHome = () => { setView("home"); window.scrollTo(0, 0); };
  const goAccount = () => { setView("account"); window.scrollTo(0, 0); };
  const logout = () => { setToken(null); setUser(null); goHome(); };

  const shared = { lang, setLang, user, setUser, onLogin: () => setAuthOpen(true), onLogout: logout };

  let screen;
  if (view === "report") screen = <Report {...shared} catastro={catastro} onBack={goHome} />;
  else if (view === "account") screen = <Account {...shared} onBack={goHome} onOpen={open} />;
  else screen = <Home {...shared} onOpen={open} onAccount={goAccount} />;

  return (
    <>
      {screen}
      {authOpen && (
        <Auth lang={lang} onClose={() => setAuthOpen(false)} onSuccess={(u) => { setUser(u); setAuthOpen(false); }} />
      )}
    </>
  );
}
