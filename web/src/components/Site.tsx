import { Link, useLocation } from 'react-router-dom';
import { LangSwitch, useT } from '../i18n';

export function Logo({ label = true }: { label?: boolean }) {
  const t = useT();
  return (
    <Link to="/" className="logo" aria-label={t.common.home}>
      <span className="logo__mark"><span className="logo__dot" /></span>
      {label && 'plug'}
    </Link>
  );
}

/** Top navigation of the light marketing pages. */
export function SiteNav({ packsHref = '/tarifs#packs', howHref = '/#fonctionnement' }: { packsHref?: string; howHref?: string }) {
  const { pathname } = useLocation();
  const t = useT();
  return (
    <nav className="site-nav" aria-label={t.nav.label}>
      <Logo />
      <div className="site-nav__links">
        <Link to="/editeur">{t.nav.editor}</Link>
        <Link to={howHref}>{t.nav.how}</Link>
        <Link to="/tarifs" aria-current={pathname === '/tarifs' ? 'page' : undefined}>{t.nav.pricing}</Link>
        <Link to={packsHref}>{t.nav.styles}</Link>
      </div>
      <div className="site-nav__cta">
        <LangSwitch />
        <Link to="/inscription?mode=login" className="btn-ghost-light">{t.nav.login}</Link>
        <Link to="/inscription" className="btn-dark">{t.nav.trial}</Link>
      </div>
    </nav>
  );
}

export function SiteFooter({ links }: { links: [string, string][] }) {
  const t = useT();
  return (
    <footer className="site-footer">
      <span>© 2026 Plug</span>
      <nav aria-label={t.nav.footer}>
        {links.map(([label, to]) => <Link key={label} to={to}>{label}</Link>)}
      </nav>
    </footer>
  );
}
