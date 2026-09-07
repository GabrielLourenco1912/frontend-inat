import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "INAT Paranaguá | Aprendizagem que abre caminhos",
  description:
    "Formação profissional, acompanhamento de jovens e conexão responsável com empresas parceiras em Paranaguá.",
  icons: {
    icon: [
      {
        url: "/brand/inat-logo.png",
        sizes: "500x500",
        type: "image/png",
      },
    ],
    shortcut: "/brand/inat-logo.png",
    apple: "/brand/inat-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--inat-bg)] text-[var(--inat-primary)]">
        {children}
      </body>
    </html>
  );
}
