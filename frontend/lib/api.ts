// Konfigurasi akses API — Backend-Mediated: frontend HANYA mengakses Laravel API,
// TIDAK pernah langsung ke Steam Web API / CheapShark (sesuai Section 3 & 6).

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

export function formatCurrency(value: number | null, currency: string | null = "IDR"): string {
  if (value === null) return "—";
  const code = currency || "IDR";
  const fractionDigits = code === "IDR" ? 0 : 2;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

// SWR fetcher standar (untuk endpoint publik)
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

// Fetcher untuk endpoint yang butuh auth
export async function authFetcher<T = unknown>(url: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("gamehub_token") : null;
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

// Helper untuk POST/DELETE dengan auth
export async function authRequest<T = unknown>(
  url: string,
  method: "POST" | "DELETE" | "PUT" | "PATCH" = "POST",
  body?: unknown
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("gamehub_token") : null;
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Tipe data (mencerminkan payload Laravel API) ----------

export interface GameListItem {
  id: number;
  title: string;
  genre: string | null;
  description: string | null;
  screenshots: string[] | null;
  lowest_price: number | null;
  lowest_price_original?: number | null;
  lowest_price_discount_percentage?: number | null;
  lowest_price_platform?: string | null;
  lowest_price_currency?: string | null;
  lowest_price_discounted: boolean;
  last_checked_at?: string | null;
  platforms_count: number;
}

export interface PriceEntry {
  platform: string | null;
  current_price: number;
  original_price: number | null;
  currency: string;
  is_discounted: boolean;
  discount_percentage: number | null;
  last_checked_at: string | null;
  is_lowest: boolean;
}

export interface GameDetail extends GameListItem {
  system_requirements?: {
    minimum?: { os?: string; cpu?: string; ram?: string; gpu?: string };
    recommended?: { os?: string; cpu?: string; ram?: string; gpu?: string };
  } | null;
  prices: PriceEntry[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
  };
  links: { url: string | null; label: string; active: boolean }[];
}

export interface MetaResponse {
  platforms: string[];
  genres: string[];
}
