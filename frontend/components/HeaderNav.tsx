"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export default function HeaderNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to homepage with search query
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-[#0a0d14]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="group flex flex-shrink-0 items-center gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Game<span className="text-[#a3e635]">Hub</span>
            </span>
          </Link>

          {/* Search Bar */}
          <div className="mx-4 hidden max-w-xl flex-1 md:block">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari game, genre, atau developer..."
                className="w-full rounded-xl border border-slate-800 bg-[#121622] py-2.5 pl-10 pr-16 text-sm text-slate-200 placeholder-slate-500 transition duration-200 hover:bg-[#161c2b] focus:border-[#a3e635] focus:bg-[#161c2b] focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <kbd className="rounded border border-slate-700/60 bg-slate-800/80 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">
                  Ctrl K
                </kbd>
              </div>
            </form>
          </div>

          {/* Right Action Items */}
          <nav className="flex flex-shrink-0 items-center gap-6 text-sm font-semibold">
            <Link href="/" className="flex items-center gap-2 text-slate-300 transition hover:text-white">
              <i className="fa-solid fa-table-cells-large text-slate-400"></i>
              <span className="hidden sm:inline">Katalog</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/wishlist" className="flex items-center gap-2 text-slate-300 transition hover:text-white">
                  <i className="fa-regular fa-heart text-slate-400"></i>
                  <span className="hidden sm:inline">Wishlist</span>
                </Link>

                {/* User Profile Pill */}
                <div className="relative flex items-center gap-3 border-l border-slate-800 pl-2">
                  <button
                    type="button"
                    aria-label="User Menu"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2.5 rounded-full p-1 transition hover:bg-slate-800/60"
                  >
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-[#a3e635]/40">
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                    <span className="hidden text-sm font-medium text-slate-200 sm:inline-block">{user?.name}</span>
                    <i className="fa-solid fa-chevron-down mr-1 text-[10px] text-slate-400"></i>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0d0f17] shadow-xl">
                      <div className="p-3 border-b border-slate-800">
                        <p className="text-sm font-semibold text-white">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                          <i className="fa-solid fa-right-from-bracket text-slate-400"></i>
                          <span>Logout</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowLogin(true);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                          <i className="fa-solid fa-user-plus text-slate-400"></i>
                          <span>Tambahkan Akun Lain</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="rounded-lg bg-[#a3e635] px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-[#bef264]"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d0b16] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Login ke Game Hub</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-[#121622] px-4 py-2.5 text-white outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
              placeholder="nama@email.com"
            />
          </div>
          
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-[#121622] px-4 py-2.5 text-white outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#a3e635] py-2.5 font-semibold text-black transition hover:bg-[#bef264] disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-xs text-slate-500">
          Demo: gunakan user dari seeder database
        </p>
      </div>
    </div>
  );
}
