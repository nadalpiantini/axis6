import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AXIS6 - Equilibrio en 6 Ejes",
  description: "Alcanza el equilibrio perfecto en las 6 dimensiones de tu vida. Rastrea tu progreso diario y conviértete en tu mejor versión.",
  keywords: "bienestar, equilibrio, hábitos, productividad, salud mental, desarrollo personal",
  authors: [{ name: "AXIS6 Team" }],
  manifest: "/manifest.json",
  themeColor: "#0A0E1A",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXIS6"
  },
  openGraph: {
    title: "AXIS6 - Equilibrio en 6 Ejes",
    description: "Seis ejes. Un solo tú. No rompas tu Axis.",
    type: "website",
    locale: "es_ES",
    url: "https://axis6.sujeto10.com",
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
    title: "AXIS6 - Balance de Vida",
    description: "Rastrea y balancea las 6 dimensiones de tu vida",
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
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
