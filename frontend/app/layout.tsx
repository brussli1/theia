import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { getDictionary, getLocale } from "./lib/i18n";
import { pageMetadata, SITE_URL } from "./lib/metadata";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const t = getDictionary(locale);
  const site = pageMetadata({
    locale,
    title: t.meta.title,
    description: t.meta.description,
    path: "/",
  });
  return {
    ...site,
    metadataBase: new URL(SITE_URL),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
