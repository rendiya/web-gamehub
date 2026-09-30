"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { GameDetail } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authFetcher, authRequest } from "@/lib/api";

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params adalah Promise di Next.js 16 — butuh React 19 use() hook via await.
  // Kita baca lewat state dengan approach sederhana: gunakan id via use() di dalam
  // komponen, tapi karena ini client component, kita resolve di wrapper.
  // Solusi: pakai komponen inner yang menerima id synchronous.
  return <GameDetailResolver params={params} />;
}

function GameDetailResolver({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    params.then((p) => {
      if (active) setId(p.id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  if (id === null) {
    return <p className="text-white/60">Memuat game…</p>;
  }

  return <GameDetailView id={id} />;
}

function GameDetailView({ id }: { id: string }) {
  const { data: response, error, isLoading } = useSWR<{data: GameDetail}>(`/games/${id}`);
  const { isAuthenticated } = useAuth();
  const { data: checkData, mutate: mutateWishlist } = useSWR<{ in_wishlist: boolean }>(
    isAuthenticated ? `/wishlists/check/${id}` : null,
    authFetcher
  );
  const [processing, setProcessing] = useState(false);

  const inWishlist = checkData?.in_wishlist ?? false;
  const data = response?.data; // Unwrap {data: {...}} dari Laravel API Resource

  const handleWishlistToggle = async () => {
    if (!isAuthenticated || processing) return;

    setProcessing(true);
    try {
      if (inWishlist) {
        await authRequest(`/wishlists/game/${id}`, "DELETE");
      } else {
        await authRequest(`/wishlists`, "POST", { game_id: parseInt(id) });
      }
      mutateWishlist();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <p className="text-white/60">Memuat game…</p>;

  if (error) {
    return <NotFoundState />;
  }

  if (!data) {
    console.warn('No data returned for game:', id);
    return <p className="text-white/60">Tidak ada data.</p>;
  }

  console.log('✓ Rendering game:', data.title, '- Prices:', data.prices?.length);
  const req = data.system_requirements;

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-white/50 hover:text-white transition-colors"
      >
        ← Kembali ke katalog
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{data.title}</h1>
              <p className="mt-1 text-sm text-white/50">{data.genre}</p>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={handleWishlistToggle}
                disabled={processing}
                className="shrink-0 rounded-full border border-white/20 bg-[#0d0b16] p-3 transition hover:scale-110 hover:border-red-400/60 disabled:opacity-50"
                title={inWishlist ? "Hapus dari wishlist" : "Tambah ke wishlist"}
              >
                <svg
                  className={`h-6 w-6 transition ${inWishlist ? "fill-red-400 text-red-400" : "fill-none text-white/70"}`}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            )}
          </div>

          {data.screenshots?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.screenshots[0]}
              alt={data.title}
              loading="eager"
              className="mt-4 w-full rounded-xl border border-slate-700 object-cover"
            />
          )}

          <h2 className="mt-6 text-lg font-semibold text-white">Deskripsi</h2>
          <p className="mt-2 text-white/70">
            {data.description && data.description.trim() !== data.title.trim() 
              ? data.description 
              : "Informasi detail untuk game ini belum tersedia. Harga dan platform dapat dilihat di panel sebelah kanan."}
          </p>

          {req && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {req.minimum && (
                <div className="rounded-lg border border-white/10 bg-[#0d0b16] p-4">
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Minimum
                  </h3>
                  <ReqList r={req.minimum} />
                </div>
              )}
              {req.recommended && (
                <div className="rounded-lg border border-white/10 bg-[#0d0b16] p-4">
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Recommended
                  </h3>
                  <ReqList r={req.recommended} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Harga per platform (Epic 2: perbandingan berdampingan + termurah ditandai) */}
        <aside className="h-fit rounded-xl border border-white/10 bg-[#0d0b16] p-5">
          <h2 className="text-lg font-semibold text-white">Harga per Platform</h2>
          {data.prices && data.prices.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {data.prices.map((p, i) => (
                <li
                  key={`${p.platform}-${i}`}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    p.is_lowest
                      ? "border-lime-500/60 bg-lime-500/10"
                      : "border-white/10"
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">
                      {p.platform}{" "}
                      {p.is_lowest && (
                        <span className="ml-1 rounded bg-lime-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                          TERMURAH
                        </span>
                      )}
                    </div>
                    {p.is_discounted && (
                      <span className="mt-0.5 inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                        DISKON
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {p.is_discounted && p.original_price !== null && (
                      <p className="text-xs text-white/40 line-through">
                        {formatCurrency(p.original_price, p.currency)}
                      </p>
                    )}
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(p.current_price, p.currency)}
                    </p>
                    {p.discount_percentage ? (
                      <span className="text-xs font-semibold text-red-300">-{p.discount_percentage}%</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-white/50">
              Belum ada data harga untuk game ini.
            </p>
          )}

          {data.last_checked_at && (
            <p className="mt-4 text-xs text-white/40">
              Data diperbarui pada{" "}
              {new Date(data.last_checked_at).toLocaleString("id-ID")}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReqList({
  r,
}: {
  r: { os?: string; cpu?: string; ram?: string; gpu?: string };
}) {
  const rows = [
    ["OS", r.os],
    ["CPU", r.cpu],
    ["RAM", r.ram],
    ["GPU", r.gpu],
  ].filter(([, v]) => v);
  return (
    <dl className="space-y-1 text-sm text-white/70">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2">
          <dt className="text-white/40">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function NotFoundState() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-white">Game tidak ditemukan</h1>
      <p className="mt-2 text-white/60">
        Game yang Anda cari tidak ada. Mungkin sudah tidak terdaftar.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-400"
      >
        Kembali ke katalog
      </Link>
    </div>
  );
}
