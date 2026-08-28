import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/server/seo/site";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Explore Cook Thrive",
    template: "%s · Explore Cook Thrive",
  },
  description:
    "Keep the flavor. Improve the recipe. Explore Cook Thrive finds nutrition upgrades that respect the dish you already love.",
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
  openGraph: {
    title: "Explore Cook Thrive",
    description:
      "Keep the flavor. Improve the recipe. Explore Cook Thrive finds nutrition upgrades that respect the dish you already love.",
    images: [
      {
        url: "/brand/logo.png",
        width: 1254,
        height: 1254,
        alt: "Explore Cook Thrive — Love your food. Nourish your life.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Cook Thrive",
    description:
      "Keep the flavor. Improve the recipe. Explore Cook Thrive finds nutrition upgrades that respect the dish you already love.",
    images: ["/brand/logo.png"],
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
      className={`${lato.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-teal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
