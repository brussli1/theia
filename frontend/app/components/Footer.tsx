import Link from "next/link";
import { CONTACT_EMAIL, WHATSAPP_URL } from "../lib/contact";
import { getDictionary, getLocale } from "../lib/i18n";

/** Site-wide footer (#17): links to the content pages and contact channels.
 *  Server component — dictionary lookups happen at render time. */
export default async function Footer() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const f = t.pages.footer;
  const shopLinks = [
    { href: "/productos", label: f.products },
    { href: "/cotizacion", label: f.quotes },
    { href: "/usados", label: f.used },
    { href: "/alquiler", label: f.rentals },
  ];
  const helpLinks = [
    { href: "/soporte", label: f.support },
    { href: "/contacto", label: f.contact },
    { href: "/mapa", label: f.map },
  ];
  const legalLinks = [
    { href: "/tos", label: f.terms },
    { href: "/privacidad", label: f.privacy },
  ];
  return (
    <footer data-testid="footer" className="mt-12 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-8 py-12 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold tracking-tight text-white">
            Theia<span className="text-brand-400">.</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">{f.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-brand-400"
            >
              {t.pages.contacto.whatsapp}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-slate-300 hover:text-brand-400"
            >
              {t.pages.contacto.email}
            </a>
          </div>
        </div>
        <nav aria-label={f.shop} className="text-sm">
          <p className="font-semibold text-white">{f.shop}</p>
          <ul className="mt-3 space-y-2">
            {shopLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-slate-300 hover:text-brand-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm">
          <nav aria-label={f.help}>
            <p className="font-semibold text-white">{f.help}</p>
            <ul className="mt-3 space-y-2">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-300 hover:text-brand-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={f.legal} className="mt-6">
            <p className="font-semibold text-white">{f.legal}</p>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-300 hover:text-brand-400">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/admin"
                  data-testid="footer-admin-link"
                  className="text-slate-300 hover:text-brand-400"
                >
                  {f.admin}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Theia
      </div>
    </footer>
  );
}
