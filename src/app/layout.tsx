import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0E1A",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://axis6.app' : 'http://localhost:6789'),
  title: "AXIS6 - Balance in 6 Dimensions",
  description: "Achieve perfect balance across the 6 dimensions of your life. Track your daily progress and become your best version.",
  keywords: "wellness, balance, habits, productivity, mental health, personal development",
  authors: [{ name: "AXIS6 Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXIS6"
  },
  openGraph: {
    title: "AXIS6 - Balance in 6 Dimensions",
    description: "Six axes. One you. Don't break your Axis.",
    type: "website",
    locale: "en_US",
    url: "https://axis6.app",
    siteName: "AXIS6",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AXIS6 - Life Balance",
    description: "Track and balance the 6 dimensions of your life",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
