import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fraunces, Inter, Geist_Mono, Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { FavoritesProvider } from "@/lib/favorites";
import { LocationOnEntry } from "@/components/location-on-entry";
import { hasLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/lib/i18n/client";
import "../globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Thai glyphs for the sans and display stacks. Not preloaded: the browser only
// fetches them (by unicode-range) on pages that actually contain Thai text.
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  preload: false,
});

const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-noto-serif-thai",
  subsets: ["thai"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface LangParams {
  params: Promise<{ lang: string }>;
}

// Only /en and /th exist; anything else is a 404 (proxy.ts adds the prefix).
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    // Makes canonical and hreflang links absolute.
    metadataBase: new URL(process.env.SITE_URL ?? "https://brewmap-cafe.vercel.app"),
    title: { default: t.meta.siteTitle, template: "%s — BrewMap" },
    description: t.meta.siteDescription,
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
}> &
  LangParams) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      // Smooth in-page scrolling, but route changes still jump straight to the top.
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} ${notoSansThai.variable} ${notoSerifThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink bg-paper">
        <I18nProvider lang={lang}>
          <AuthProvider>
            <FavoritesProvider>
              <LocationOnEntry />
              {children}
            </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
