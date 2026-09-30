"use client";

import { useAuth } from "@/lib/auth";
import { authFetcher, authRequest } from "@/lib/api";
import useSWR from "swr";
import Link from "next/link";
import { useState, useEffect } from "react";

interface WishlistItem {
  id: number;
  game_id: number;
  game_title: string;
  game_image: string | null;
  lowest_price: number | string | null;
  currency: string;
  is_discounted: boolean;
  platform: string | null;
  added_at: string;
}

export default function WishlistPage() {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<{ data: WishlistItem[] }>(
    isAuthenticated && mounted ? "/wishlists" : null,
    authFetcher
  );

  const [removing, setRemoving] = useState<number | null>(null);

  const formatWishlistPrice = (value: number | string | null, currency: string) => {
    if (value === null || value === "") return null;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;

    if (currency === "IDR") {
      return `Rp ${numericValue.toLocaleString("id-ID")}`;
    }

    if (currency === "USD") {
      return `Rp ${(numericValue * 15000).toLocaleString("id-ID")}`;
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
    }).format(numericValue);
  };

  const handleRemove = async (wishlistId: number) => {
    setRemoving(wishlistId);
    try {
      await authRequest(`/wishlists/${wishlistId}`, "DELETE");
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setRemoving(null);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <p className="text-white/60">Memuat...</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-white">Login dulu untuk akses wishlist</p>
          <p className="mt-2 text-sm text-white/50">Klik tombol Login di header untuk masuk</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-lime-300 mb-4">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Katalog
        </Link>
        <h1 className="text-3xl font-bold text-white">Wishlist Saya</h1>
        <p className="mt-2 text-white/60">
          Game yang kamu simpan untuk dilacak harga & diskonnya
        </p>
      </div>

      {isLoading && <p className="text-white/60">Memuat wishlist...</p>}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          Gagal memuat wishlist. Silakan refresh halaman.
        </div>
      )}

      {!isLoading && !error && data && data.data.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0d0b16] p-12 text-center">
          <p className="text-lg text-white">Wishlist masih kosong</p>
          <p className="mt-2 text-sm text-white/50">
            Tambahkan game dari katalog dengan klik tombol ❤️ di card game
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-lime-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-lime-400"
          >
            Jelajahi Katalog
          </Link>
        </div>
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <div className="space-y-4">
          {data.data.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-white/10 bg-[#0d0b16] p-4 transition hover:border-lime-400/40"
            >
              <Link href={`/games/${item.game_id}`} className="shrink-0">
                <img
                  src={item.game_image || "/placeholder.jpg"}
                  alt={item.game_title}
                  loading="eager"
                  className="h-24 w-40 rounded-lg border border-slate-700 object-cover"
                />
              </Link>
              
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/games/${item.game_id}`} className="hover:underline">
                    <h3 className="font-bold text-white">{item.game_title}</h3>
                  </Link>
                  <p className="mt-1 text-xs text-white/40">
                    Ditambahkan {new Date(item.added_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    {formatWishlistPrice(item.lowest_price, item.currency) !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">
                          {formatWishlistPrice(item.lowest_price, item.currency)}
                        </span>
                        {item.is_discounted && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                            DISKON
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-white/50">Harga tidak tersedia</span>
                    )}
                    {item.platform && (
                      <p className="mt-0.5 text-xs text-white/40">Termurah di {item.platform}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                  >
                    {removing === item.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
