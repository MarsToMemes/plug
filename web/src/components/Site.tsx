import { Link, useLocation } from 'react-router-dom';

export function Logo({ label = true }: { label?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label="Plug, accueil">
      <span className="logo__mark"><span className="logo__dot" /></span>
      {label && 'plug'}
    </Link>
  );
}

/** Top navigation of the light marketing pages. */
export function SiteNav({ packsHref = '/tarifs#packs', howHref = '/#fonctionnement' }: { packsHref?: string; howHref?: string }) {
  const { pathname } = useLocation();
  return (
    <nav className="site-nav" aria-label="Navigation principale">
      <Logo />
      <div className="site-nav__links">
        <Link to="/editeur">Éditeur</Link>
        <Link to={howHref}>Fonctionnement</Link>
        <Link to="/tarifs" aria-current={pathname === '/tarifs' ? 'page' : undefined}>Tarifs</Link>
        <Link to={packsHref}>Packs</Link>
      </div>
      <div className="site-nav__cta">
        <Link to="/inscription?mode=login" className="btn-ghost-light">Connexion</Link>
        <Link to="/inscription" className="btn-dark">Essai gratuit</Link>
      </div>
    </nav>
  );
}

export function SiteFooter({ links }: { links: [string, string][] }) {
  return (
    <footer className="site-footer">
      <span>© 2026 Plug</span>
      <nav aria-label="Pied de page">
        {links.map(([label, to]) => <Link key={label} to={to}>{label}</Link>)}
      </nav>
    </footer>
  );
}
