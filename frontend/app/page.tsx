"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import type { GameListItem, MetaResponse, Paginated } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import GameCard from "@/components/GameCard";

type SortKey = "" | "price_asc" | "price_desc" | "discount" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "discount", label: "Diskon Terbesar" },
  { value: "newest", label: "Terbaru" },
];

const PLATFORM_FILTERS = [
  { value: "", label: "Semua", icon: "" },
  { value: "Steam", label: "Steam", icon: "fa-brands fa-steam" },
  { value: "Epic Games", label: "Epic Games", icon: "fa-solid fa-gamepad" },
  { value: "GOG", label: "GOG", icon: "fa-solid fa-globe" },
];

const GENRE_CARDS = [
  { name: "Action", color: "from-red-900/60 to-red-950/80", icon: "fa-solid fa-fire" },
  { name: "RPG", color: "from-cyan-900/60 to-cyan-950/80", icon: "fa-solid fa-dragon" },
  { name: "Adventure", color: "from-purple-900/60 to-purple-950/80", icon: "fa-solid fa-compass" },
  { name: "Strategy", color: "from-amber-900/60 to-amber-950/80", icon: "fa-solid fa-chess" },
  { name: "Indie", color: "from-violet-900/60 to-violet-950/80", icon: "fa-solid fa-paintbrush" },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<SortKey>("discount");

  // Read search from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearch(searchParam);
      setDebouncedSearch(searchParam);
    }
  }, []);

  const { data: deals } = useSWR<Paginated<GameListItem>>("/games?sort=discount&per_page=6");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("per_page", "18");
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (platform) params.set("platform", platform);
    if (genre) params.append("genre[]", genre);
    if (sort) params.set("sort", sort);
    return `/games?${params.toString()}`;
  }, [debouncedSearch, platform, genre, sort]);

  const { data, error, isLoading } = useSWR<Paginated<GameListItem>>(query);

  const discountedGames = deals?.data.filter((game) => game.lowest_price_discounted) ?? [];
  const featuredGame = discountedGames[0];

  return (
    <div className="space-y-12">
      {/* Hero Section - Full Width Background */}
      {featuredGame && (
        <section className="relative -mx-4 -mt-6 mb-12 min-h-[700px] overflow-hidden sm:-mx-6 lg:-mx-8">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={featuredGame.screenshots?.[0] || ""}
              alt={featuredGame.title}
              className="h-full w-full animate-slow-zoom object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-transparent to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative mx-auto flex min-h-[700px] max-w-7xl items-end px-4 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-6">
              <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-[#a3e635]/30 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#a3e635] backdrop-blur">
                <i className="fa-solid fa-gamepad"></i>
                <span>GAME HUB / DISCOVER</span>
              </div>

              <h1 className="animate-fade-in-up animation-delay-100 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                Main lebih banyak.
                <br />
                <span className="text-[#a3e635]">Bayar lebih cerdas.</span>
              </h1>

              <p className="animate-fade-in-up animation-delay-200 text-lg leading-relaxed text-slate-300">
                Temukan game, bandingkan harga, dan temukan promo terbaik dalam satu tempat.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                <div className="animate-fade-in-up animation-delay-300 flex items-start gap-3 rounded-xl border border-slate-800/50 bg-black/40 p-4 backdrop-blur transition-all hover:scale-105 hover:border-[#a3e635]/50 hover:shadow-lg hover:shadow-[#a3e635]/20">
                  <div className="flex h-10 w-10 flex-shrink-0 animate-pulse-slow items-center justify-center rounded-lg bg-[#a3e635]/20">
                    <i className="fa-solid fa-shield-halved text-lg text-[#a3e635]"></i>
                  </div>
                  <div>
                    <p className="font-bold text-white">Harga Terbaik</p>
                    <p className="text-xs text-slate-400">Bandingkan antar platform</p>
                  </div>
                </div>

                <div className="animate-fade-in-up animation-delay-400 flex items-start gap-3 rounded-xl border border-slate-800/50 bg-black/40 p-4 backdrop-blur transition-all hover:scale-105 hover:border-[#a3e635]/50 hover:shadow-lg hover:shadow-[#a3e635]/20">
                  <div className="flex h-10 w-10 flex-shrink-0 animate-pulse-slow items-center justify-center rounded-lg bg-[#a3e635]/20">
                    <i className="fa-solid fa-bolt text-lg text-[#a3e635]"></i>
                  </div>
                  <div>
                    <p className="font-bold text-white">Promo Terbaru</p>
                    <p className="text-xs text-slate-400">Update setiap hari</p>
                  </div>
                </div>

                <div className="animate-fade-in-up animation-delay-500 flex items-start gap-3 rounded-xl border border-slate-800/50 bg-black/40 p-4 backdrop-blur transition-all hover:scale-105 hover:border-[#a3e635]/50 hover:shadow-lg hover:shadow-[#a3e635]/20">
                  <div className="flex h-10 w-10 flex-shrink-0 animate-pulse-slow items-center justify-center rounded-lg bg-[#a3e635]/20">
                    <i className="fa-solid fa-heart text-lg text-[#a3e635]"></i>
                  </div>
                  <div>
                    <p className="font-bold text-white">Wishlist</p>
                    <p className="text-xs text-slate-400">Simpan game favoritmu</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="animate-fade-in-up animation-delay-600 flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#promo"
                  className="inline-flex transform items-center justify-center gap-2 rounded-xl bg-[#a3e635] px-8 py-4 text-base font-bold text-black shadow-lg shadow-[#a3e635]/20 transition hover:scale-105 hover:bg-[#bef264] active:scale-95"
                >
                  <span>Jelajahi Katalog</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </a>
                <a
                  href="#promo"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-black/40 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:scale-105 hover:bg-slate-800/40"
                >
                  Lihat Promo
                </a>
              </div>

              {/* Featured Game Info */}
              <div className="animate-fade-in-up animation-delay-700 flex items-center gap-4 rounded-xl border border-slate-800/50 bg-black/40 p-4 backdrop-blur">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Featured Game</p>
                  <p className="text-xl font-bold text-white">{featuredGame.title}</p>
                </div>
                {featuredGame.lowest_price && (
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-[#a3e635]">
                      {formatCurrency(featuredGame.lowest_price, featuredGame.lowest_price_currency)}
                    </p>
                    {featuredGame.lowest_price_discounted && (
                      <span className="inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        -{featuredGame.lowest_price_discount_percentage ?? 0}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sedang Diskon Section */}
      <section className="space-y-5" id="promo">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <i className="fa-solid fa-fire text-xl text-amber-500"></i>
              <h2 className="font-extrabold uppercase tracking-wide">Sedang Diskon</h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Game dengan harga terbaik minggu ini</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Urutkan:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-800 bg-[#121622] px-3 py-1.5 text-slate-200 outline-none transition hover:bg-slate-800 focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform Filter Chips */}
        <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
          {PLATFORM_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setPlatform(filter.value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
                platform === filter.value
                  ? "bg-[#a3e635] font-bold text-black shadow-sm"
                  : "border border-slate-800 bg-[#121622] text-slate-300 hover:bg-slate-800"
              }`}
            >
              {filter.icon && <i className={`${filter.icon} text-slate-400`}></i>}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Game Grid - 6 columns */}
        {isLoading && <p className="text-slate-400">Memuat game…</p>}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            Gagal memuat data. Silakan cek koneksi ke server backend atau coba lagi.
          </div>
        )}
        {!isLoading && !error && data && data.data.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-[#10141e] p-8 text-center">
            <p className="text-lg text-white">Game tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kategori.</p>
          </div>
        )}
        {!isLoading && !error && data && data.data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {data.data.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Genre Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <i className="fa-solid fa-gamepad text-xl text-[#a3e635]"></i>
              <h2 className="font-extrabold uppercase tracking-wide">Browse Your Way</h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Jelajahi berdasarkan genre</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {GENRE_CARDS.map((genreCard, idx) => (
            <button
              key={genreCard.name}
              type="button"
              onClick={() => {
                setGenre((current) => current === genreCard.name ? "" : genreCard.name);
                document.getElementById("promo")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{ animationDelay: `${idx * 0.1}s` }}
              className={`group relative h-32 animate-fade-in-up overflow-hidden rounded-2xl border transition-all hover:scale-105 hover:border-[#a3e635]/50 hover:shadow-lg hover:shadow-[#a3e635]/20 ${
                genre === genreCard.name ? "border-[#a3e635] ring-2 ring-[#a3e635]/30" : "border-slate-800/90"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${genreCard.color} transition-all group-hover:opacity-80`}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <i className={`${genreCard.icon} text-3xl text-white/80 transition-all group-hover:scale-125 group-hover:text-[#a3e635]`}></i>
                <p className="text-lg font-extrabold tracking-wide text-white">{genreCard.name}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
