import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers"; // pindahkan SessionProvider ke file terpisah

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kelola Kas Kelas",
  description: "Aplikasi untuk mengelola kas kelas dengan mudah dan efisien",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}