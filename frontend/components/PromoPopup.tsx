"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { GameListItem, Paginated } from "@/lib/api";
import { API_BASE } from "@/lib/api";

const POPUP_SEEN_KEY = "gamehub-discount-popup-seen";

async function discountFetcher(url: string): Promise<Paginated<GameListItem>> {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export default function PromoPopup() {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data } = useSWR<Paginated<GameListItem>>(
    "/games?sort=discount&per_page=50",
    discountFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  const discountedGames = useMemo(
    () => data?.data.filter((game) => game.lowest_price_discounted) ?? [],
    [data]
  );

  useEffect(() => {
    if (discountedGames.length === 0) return;
    if (window.sessionStorage.getItem(POPUP_SEEN_KEY) === "1") return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.sessionStorage.setItem(POPUP_SEEN_KEY, "1");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [discountedGames.length]);

  if (!open || discountedGames.length === 0) return null;

  const game = discountedGames[currentIndex % discountedGames.length];
  const poster = game.screenshots?.[0];

  function closePopup() {
    setOpen(false);
  }

  function nextGame() {
    setCurrentIndex((index) => (index + 1) % discountedGames.length);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-popup-title"
    >
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-lime-400/40 bg-[#100c1d] shadow-2xl shadow-lime-950/60">
        <button
          type="button"
          onClick={closePopup}
          aria-label="Tutup promo diskon"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 text-xl leading-none text-white/70 transition hover:bg-black/80 hover:text-white"
        >
          ×
        </button>

        <div className="relative aspect-video overflow-hidden bg-black/40">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl font-bold text-white/20">
              {game.title.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold tracking-wide text-white">
            SEDANG DISKON
          </span>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
            Rekomendasi promo hari ini
          </p>
          <h2 id="discount-popup-title" className="mt-2 text-2xl font-bold text-white">
            {game.title}
          </h2>
          <p className="mt-1 text-sm text-white/55">{game.genre ?? "Game pilihan"}</p>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/45">Mulai dari</p>
              <p className="text-2xl font-bold text-white">
                {game.lowest_price_currency === "USD" ? "$" : game.lowest_price_currency ?? ""}
                {game.lowest_price?.toFixed(2) ?? "—"}
              </p>
              <p className="text-xs text-white/45">
                di {game.lowest_price_platform ?? "platform resmi"}
              </p>
            </div>
            <span className="rounded bg-red-500/15 px-2 py-1 text-xs font-bold text-red-300">
              DISKON
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <Link
              href={`/games/${game.id}`}
              onClick={closePopup}
              className="flex-1 rounded-lg bg-lime-600 px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-lime-500"
            >
              Lihat Detail
            </Link>
            {discountedGames.length > 1 && (
              <button
                type="button"
                onClick={nextGame}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Next →
              </button>
            )}
          </div>

          <p className="mt-3 text-center text-[11px] text-white/35">
            Harga referensi dari database Game Hub. Cek platform resmi saat checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
