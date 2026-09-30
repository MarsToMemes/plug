import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Accueil from './pages/Accueil';
import Editeur from './pages/Editeur';
import Tarifs from './pages/Tarifs';
import Inscription from './pages/Inscription';

const TITLES: Record<string, string> = {
  '/': 'Plug — Votre script, monté comme un documentaire',
  '/editeur': 'Éditeur — Plug',
  '/tarifs': 'Tarifs — Plug',
  '/inscription': 'Inscription — Plug'
};

/** Scrolls to #anchors after navigation, or to the top on a new page. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] || 'Plug';
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  // The app has rendered once: the startup error display of index.html stops here.
  useEffect(() => { (window as { __plugStarted?: boolean }).__plugStarted = true; }, []);
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/editeur" element={<Editeur />} />
        <Route path="/tarifs" element={<Tarifs />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="*" element={<Accueil />} />
      </Routes>
    </>
  );
}
