import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dillon | Whiskey Bar & Live Music",
  description: "Live music, DJs & whiskey in the heart of Reykjavík. Laugavegur 30, 101 Reykjavík.",
  metadataBase: new URL("https://dillon.is"),
  openGraph: {
    title: "Dillon | Whiskey Bar & Live Music",
    description: "Live music, DJs & whiskey in the heart of Reykjavík. Laugavegur 30, 101 Reykjavík.",
    url: "https://dillon.is",
    siteName: "Dillon Whiskey Bar",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dillon Whiskey Bar - Reykjavík",
      },
    ],
    locale: "is_IS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dillon | Whiskey Bar & Live Music",
    description: "Live music, DJs & whiskey in the heart of Reykjavík.",
    images: ["/images/og-image.png"],
  },
  icons: {
    icon: "/images/tab-icon.png",
    apple: "/images/tab-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="is">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;700&family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

