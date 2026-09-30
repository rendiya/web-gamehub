"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SWRConfig
        value={{
          fetcher,
          // Data harga tidak perlu re-fetch super sering; fresh dalam 60s,
          // revalidate on focus untuk update saat user kembali ke tab.
          refreshInterval: 0,
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
          dedupingInterval: 60000,
          keepPreviousData: true,
          errorRetryCount: 2,
        }}
      >
        {children}
      </SWRConfig>
    </AuthProvider>
  );
}
