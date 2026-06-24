import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INAT",
  description:
    "Landing page institucional do INAT Paranaguá, voltada à aprendizagem profissional, jovens aprendizes, empresas parceiras e contato institucional.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--inat-bg)] text-[var(--inat-primary)]">
        {children}
      </body>
    </html>
  );
}
