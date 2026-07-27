import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The one display face. A high-contrast serif against a geometric sans is the
 * whole genre cue — it is what makes this read as a tool for noble houses
 * rather than a generic dark dashboard. Deliberately a single weight, and
 * reserved for house names and page titles (see .font-display); Geist stays
 * responsible for every piece of UI text.
 */
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Dynasty Tree Builder",
    template: "%s · Dynasty Tree Builder",
  },
  description:
    "A free canvas tool for TTRPG dungeon masters to build dynasty trees with characters, relationships, and narrative tags.",
  openGraph: {
    siteName: "Dynasty Tree Builder",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: "HuVWPAQh_dt5pplSZkLyCAADfgKGkk720h9DqhFVNTQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </body>
    </html>
  );
}
