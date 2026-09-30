import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import PromoPopup from "@/components/PromoPopup";
import HeaderNav from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "Game Hub — Direktori & Tracker Diskon Game",
  description:
    "Game Hub membantu menemukan game sesuai minat dan anggaran, membandingkan harga lintas platform, dan melacak diskon.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#07090e] text-slate-100 antialiased">
        <Providers>
          <PromoPopup />
          <HeaderNav />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

          <footer className="mt-12 border-t border-slate-800 bg-[#0a0d14]">
            <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-400">
              <p>
                Game Hub adalah direktori &amp; tracker diskon game non-komersial.
                Kami bukan reseller dan tidak menjual game — kami hanya menampilkan
                informasi harga referensi dan mengarahkan pengguna ke platform resmi
                untuk pembelian.
              </p>
              <p className="mt-2">
                Game Hub <strong className="text-slate-300">tidak berafiliasi</strong>{" "}
                dengan Steam/Valve, Epic Games, GOG, atau publisher terkait. Harga
                bersifat referensi; harga final &amp; proses pembayaran mengacu ke
                platform resmi saat checkout.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Sumber data: Steam Web API &amp; CheapShark (atribusi data).
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
