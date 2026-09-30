"use client";

import Link from "next/link";
import { formatCurrency, type GameListItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authFetcher, authRequest } from "@/lib/api";
import useSWR from "swr";
import { useState } from "react";

export default function GameCard({ game }: { game: GameListItem }) {
  const poster = game.screenshots?.[0] ?? null;
  const { isAuthenticated } = useAuth();
  const { data: checkData, mutate } = useSWR<{ in_wishlist: boolean }>(
    isAuthenticated ? `/wishlists/check/${game.id}` : null,
    authFetcher
  );
  const [processing, setProcessing] = useState(false);

  const inWishlist = checkData?.in_wishlist ?? false;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || processing) return;

    setProcessing(true);
    try {
      if (inWishlist) {
        await authRequest(`/wishlists/game/${game.id}`, "DELETE");
      } else {
        await authRequest(`/wishlists`, "POST", { game_id: game.id });
      }
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Parse genre into tags
  const tags = game.genre ? game.genre.split(",").map(g => g.trim()).slice(0, 3) : ["Game"];
  
  // Mock platforms (since API might not have this yet)
  const platforms = ["PC", "Xbox"]; // Default fallback

  // Calculate discount percentage
  const discountPercent = game.lowest_price_discount_percentage;

  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-[#10141e] transition hover:border-slate-700"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={game.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900/60 via-[#0a0f08] to-black text-5xl font-black text-white/15">
            {game.title.slice(0, 2).toUpperCase()}
          </div>
        )}

        {discountPercent ? (
          <span className="absolute left-2.5 top-2.5 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        ) : null}

        {isAuthenticated && (
          <button
            onClick={handleWishlistToggle}
            disabled={processing}
            className="absolute right-2.5 top-2.5 text-slate-300 transition hover:text-red-500 disabled:opacity-50"
            title={inWishlist ? "Hapus dari wishlist" : "Tambah ke wishlist"}
          >
            <i
              className={`text-sm ${
                inWishlist ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart"
              } rounded-full bg-black/60 p-2 backdrop-blur`}
            ></i>
          </button>
        )}

        {/* Platform Icons */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-[10px] text-slate-300 backdrop-blur"
              title={platform}
            >
              {platform === "PC" && <i className="fa-brands fa-windows"></i>}
              {platform === "Xbox" && <i className="fa-brands fa-xbox"></i>}
              {platform === "PlayStation" && <i className="fa-brands fa-playstation"></i>}
              {platform === "Steam" && <i className="fa-brands fa-steam"></i>}
            </span>
          ))}
        </div>

        {/* Detail Arrow */}
        <div className="absolute bottom-2 right-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-slate-300 backdrop-blur transition group-hover:bg-[#a3e635] group-hover:text-black">
            <i className="fa-solid fa-arrow-right text-xs"></i>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="truncate text-sm font-bold text-slate-100">{game.title}</h3>
          {/* Tags */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag, idx) => (
              <span key={idx} className="text-[10px] text-slate-500">
                {tag}
                {idx < tags.length - 1 && " •"}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3">
          {game.lowest_price_original !== null && game.lowest_price_original !== undefined && discountPercent ? (
            <p className="text-[10px] text-slate-500 line-through">
              {formatCurrency(game.lowest_price_original, game.lowest_price_currency)}
            </p>
          ) : null}
          <p className="text-sm font-extrabold text-[#a3e635]">
            {formatCurrency(game.lowest_price, game.lowest_price_currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function formatGamePrice(value: number | null, currency?: string | null): string {
  return formatCurrency(value, currency);
}
