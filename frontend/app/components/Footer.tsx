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
    <footer data-testid="footer" className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 p-8 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Theia</p>
          <p className="mt-2 text-sm text-slate-500">{f.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-slate-900"
            >
              {t.pages.contacto.whatsapp}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-slate-600 hover:text-slate-900"
            >
              {t.pages.contacto.email}
            </a>
          </div>
        </div>
        <nav aria-label={f.shop} className="text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{f.shop}</p>
          <ul className="mt-2 space-y-1.5">
            {shopLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-slate-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm text-slate-600">
          <nav aria-label={f.help}>
            <p className="font-semibold text-slate-900">{f.help}</p>
            <ul className="mt-2 space-y-1.5">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-slate-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={f.legal} className="mt-4">
            <p className="font-semibold text-slate-900">{f.legal}</p>
            <ul className="mt-2 space-y-1.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-slate-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Theia
      </div>
    </footer>
  );
}
