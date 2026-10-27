import type { Metadata } from "next";
import { Fraunces, Inter, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { FavoritesProvider } from "@/lib/favorites";
import { LocationOnEntry } from "@/components/location-on-entry";
import "./globals.css";

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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BrewMap — Taste first. Location second.",
    template: "%s — BrewMap",
  },
  description:
    "Find the right café in Chiang Mai: ask the AI finder in Thai or English, filter 173 real cafés by price, distance, parking and drink, and read AI review summaries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink bg-paper">
        <AuthProvider>
          <FavoritesProvider>
            <LocationOnEntry />
            {children}
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
