"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";
import { API_BASE } from "@/lib/api";

type SyncLog = {
  id: number;
  platform: string | null;
  status: "success" | "failed";
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

type SyncResponse = {
  data: SyncLog[];
  meta: { total: number; current_page: number; last_page: number };
};

async function adminFetcher(url: string): Promise<SyncResponse> {
  const token = window.localStorage.getItem("gamehub_token");
  const response = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : {},
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

export default function AdminPage() {
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("gamehub_token") ?? ""
  );
  const [email, setEmail] = useState("admin@gamehub.test");
  const [password, setPassword] = useState("password");
  const [loginError, setLoginError] = useState("");
  const { data, error, isLoading, mutate } = useSWR<SyncResponse>(
    token ? "/admin/sync-logs" : null,
    adminFetcher
  );

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    if (!response.ok) {
      setLoginError(body.message ?? "Login gagal.");
      return;
    }
    window.localStorage.setItem("gamehub_token", body.token);
    setToken(body.token);
  }

  function logout() {
    window.localStorage.removeItem("gamehub_token");
    setToken("");
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-white">Admin Game Hub</h1>
        <p className="mt-2 text-sm text-white/60">Login untuk melihat status sinkronisasi.</p>
        <form onSubmit={login} className="mt-6 space-y-4 rounded-xl border border-white/10 bg-[#0d0b16] p-5">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded border border-white/15 bg-black/20 p-3 text-white" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded border border-white/15 bg-black/20 p-3 text-white" />
          {loginError && <p className="text-sm text-red-300">{loginError}</p>}
          <button className="rounded bg-lime-600 px-4 py-2 font-semibold text-black hover:bg-lime-500">Login</button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Monitoring Sync Data</h1>
          <p className="mt-2 text-white/60">Audit status sync terakhir dari tiap platform.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="rounded border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10">Refresh</button>
          <button onClick={logout} className="rounded border border-red-400/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10">Logout</button>
        </div>
      </div>
      {isLoading && <p className="mt-8 text-white/60">Memuat log…</p>}
      {error && <p className="mt-8 rounded border border-red-500/30 bg-red-500/10 p-4 text-red-200">Tidak dapat memuat log. Pastikan akun memiliki role admin.</p>}
      {data && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/60"><tr><th className="p-3">Platform</th><th className="p-3">Status</th><th className="p-3">Mulai</th><th className="p-3">Error</th></tr></thead>
            <tbody>{data.data.map((log) => <tr key={log.id} className="border-t border-white/10"><td className="p-3 text-white">{log.platform ?? "—"}</td><td className={`p-3 font-semibold ${log.status === "success" ? "text-green-300" : "text-red-300"}`}>{log.status}</td><td className="p-3 text-white/60">{new Date(log.started_at).toLocaleString("id-ID")}</td><td className="p-3 text-white/60">{log.error_message ?? "—"}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
