# Game Hub — PRD & Backlog (Final Draft v2.1)

**Proyek:** Game Hub - Direktori Ensiklopedia Game dan Tracker Diskon Multi-Platform
**Kelompok:** Kelompok 2, September Intake 2 — SDG 3 (Kehidupan Sehat & Sejahtera) & SDG 4 (Pendidikan Berkualitas)
**Status:** Draft v2.1
**Total Story Points:** 56 pts (16 user stories, 6 epic)

---

## 1. Overview

Game Hub adalah website direktori dan ensiklopedia game yang menyediakan informasi harga dan diskon dari berbagai platform (Steam, Epic Games, dll), sehingga pengguna dapat menemukan game sesuai minat dan anggaran, serta mempertimbangkan pembelian game secara legal dengan harga yang lebih terjangkau.

**Masalah yang diselesaikan:** harga game digital terus naik (contoh: GTA VI Rp1,19–1,49 juta di PS Store Indonesia 2026, dibanding rata-rata upah buruh Indonesia Rp3,29 juta/bulan per data BPS Feb 2026), sementara info harga & diskon tersebar di banyak platform sehingga pengguna harus membandingkan secara manual.

## 2. Target Pengguna (User Persona)

Pengguna yang ingin mengikuti perkembangan game digital, mencari informasi harga dan diskon dari berbagai platform, dan menemukan game yang sesuai dengan minat dan anggaran mereka.

## 3. Arsitektur Sistem

**Pola:** Backend-Mediated API — frontend tidak mengakses API pihak ketiga secara langsung.

```
Laravel BE (fetch data game dari Steam Web API & CheapShark API)
        --> disimpan & diolah di MySQL
        --> Laravel REST API (JSON)
        --> Frontend
```

**Catatan teknis penting (prasyarat sebelum backlog Epic 2 & 3 dikerjakan):**
- Epic Games tidak punya storefront API publik resmi. Gunakan agregator seperti **CheapShark** atau **IsThereAnyDeal API** untuk data lintas platform, lebih aman secara legal dibanding scraping.
- Perlu **Laravel Scheduler + Queue** untuk sync harga berkala (misal tiap 6–12 jam).
- Perlu tabel `price_history` untuk mencatat perubahan harga dari waktu ke waktu — tanpa ini, fitur "tracker" tidak bisa berjalan, hanya jadi katalog statis.
- Perlu normalisasi skema data lintas platform (currency, format harga berbeda-beda per sumber).

## 4. Tech Stack

**Backend**
- Laravel 11 — REST API sesuai arsitektur Backend-Mediated di atas
- MySQL — data game, harga, `price_history`
- Laravel Sanctum — autentikasi user (dibutuhkan Epic 4 Wishlist & Epic 5 Admin)
- Laravel Queue + Scheduler (driver Redis disarankan) — sync harga berkala (prasyarat Epic 2 & 3)
- Laravel Notifications (mail + database channel) — notifikasi diskon (Epic 3) & alert admin (Epic 5)

**Frontend**
- Next.js (React) — dibutuhkan untuk SEO direktori game agar mudah ditemukan
- TailwindCSS — styling
- Recharts / Chart.js — grafik riwayat harga (Epic 3)
- SWR atau React Query — data fetching ke Laravel API

**Sumber Data Eksternal**
- Steam Web API — resmi & gratis untuk data Steam
- CheapShark API — agregator deal lintas platform (Steam, Epic, GOG, dll), alternatif aman untuk data Epic
- IsThereAnyDeal API — opsional, cakupan lebih luas

**Infrastruktur**
- Frontend: Vercel
- Backend: Railway / Laravel Forge / VPS — wajib ada queue worker aktif terus-menerus untuk scheduler sync harga
- Redis — queue & cache (disarankan, bukan wajib untuk MVP)

## 5. Data Model (ERD Ringkas)

| Tabel | Kolom Kunci |
|---|---|
| `games` | id, title, description, genre, screenshots, system_requirements |
| `platforms` | id, name (Steam, Epic, dll) |
| `prices` | id, game_id, platform_id, current_price, currency, is_discounted, last_checked_at |
| `price_history` | id, game_id, platform_id, price, checked_at |
| `users` | id, name, email, role (user/admin), notification_enabled |
| `wishlists` | id, user_id, game_id, created_at |
| `sync_logs` | id, platform_id, status (success/failed), error_message, started_at, finished_at |

## 6. Kontrak API (Contoh Endpoint)

```
GET  /api/games                     -> daftar game (support query: search, genre, platform, sort)
GET  /api/games/{id}                -> detail game + harga per platform
GET  /api/games/{id}/price-history  -> riwayat harga game (untuk grafik)
POST /api/wishlists                 -> tambah game ke wishlist (auth required)
DELETE /api/wishlists/{id}          -> hapus game dari wishlist (auth required)
GET  /api/wishlists                 -> daftar wishlist user (auth required)
GET  /api/admin/sync-logs           -> riwayat status sync data (auth required, role: admin)
```

Format komunikasi: JSON, REST, autentikasi via token (Laravel Sanctum).

## 7. Non-Functional Requirements

- **Performance:** halaman katalog & search harus load di bawah 3 detik (95th percentile) untuk dataset awal.
- **Data Freshness SLA:** harga tidak boleh lebih basi dari 12 jam — konsisten dengan jadwal sync 6–12 jam di Epic 2/3.
- **Availability / Graceful Degradation:** jika Steam Web API atau CheapShark API sedang down, sistem tetap menampilkan data terakhir yang tersimpan di database, disertai label "Data diperbarui pada [timestamp]".
- **Security:** validasi & sanitasi semua parameter search/filter (guard dari injection meski pakai Eloquent ORM); rate limiting pada endpoint publik untuk mencegah abuse.
- **Scalability:** index pada kombinasi `game_id + platform_id + checked_at` di tabel `price_history` mengingat tabel ini bertumbuh terus-menerus seiring waktu.

## 8. Scope

**In Scope (MVP):**
- Katalog game dengan search, filter, sort
- Perbandingan harga multi-platform
- Riwayat harga per game
- Wishlist per user
- Notifikasi diskon untuk game di wishlist
- Monitoring status sync data untuk admin

**Out of Scope (belum untuk MVP ini):**
- Wishlist sharing / fitur sosial
- Rekomendasi berbasis AI/ML
- Aplikasi mobile native (fokus web dulu)
- Integrasi pembayaran langsung (Game Hub hanya mengarahkan ke platform resmi, bukan reseller)

## 9. Legal & Compliance

- Game Hub bukan reseller dan tidak menjual game — hanya menampilkan info harga dan mengarahkan pengguna ke platform resmi untuk pembelian.
- Wajib mencantumkan disclaimer bahwa Game Hub **tidak berafiliasi** dengan Steam/Valve, Epic Games, atau publisher terkait, beserta atribusi sumber data (Steam Web API, CheapShark).
- Penggunaan API pihak ketiga harus mengikuti Terms of Service masing-masing (batas rate limit, larangan resale/redistribusi data mentah).
- Harga yang ditampilkan bersifat referensi; harga final & proses pembayaran tetap mengacu ke platform resmi saat checkout.

## 10. Success Metrics

- % pengguna yang berhasil menemukan game sesuai budget yang mereka tentukan (mendukung SDG 4 — akses informasi yang setara)
- Jumlah notifikasi diskon yang berhasil terkirim & tingkat klik-nya
- Rata-rata waktu yang dihemat pengguna dibanding membandingkan harga secara manual di banyak situs
- Tingkat keberhasilan sync data (% job sync yang sukses tanpa error)

## 11. Assumptions & Risks

- **Asumsi:** Steam Web API dan CheapShark API tetap tersedia gratis dan stabil selama masa pengembangan & aktif proyek.
- **Risiko:** Epic Games tidak memiliki API resmi — data Epic bergantung pada agregator pihak ketiga yang mungkin tidak selalu real-time.
- **Risiko:** perubahan kebijakan rate-limit API eksternal dapat memengaruhi frekuensi sync data.
- **Mitigasi:** tampilkan data terakhir yang valid ke user jika sync terbaru gagal (lihat NFR Availability), disertai `sync_logs` untuk audit dan alert admin (Epic 5).

---

## 12. Backlog — Epics & User Stories

### Epic 0: Katalog Dasar (sudah ada di draft awal)

- [x] **Story:** Sebagai user, saya ingin melihat daftar game
  **AC:** Sistem dapat menampilkan daftar game
  **Points:** 5
  **Implemented Sprint 1:** API GET /api/games + frontend katalog dengan GameCard.

### Epic 1: Search & Filter Umum

- [x] **Story:** Sebagai user, saya ingin mencari game berdasarkan nama
  **AC:**
  1. Ada search bar di halaman utama
  2. Hasil pencarian menampilkan game yang namanya cocok (partial match)
  3. Muncul pesan "Game tidak ditemukan" jika hasil kosong
  **Points:** 3
  **Implemented:** Search bar via SWR, debounced 400ms, partial LIKE match.

- [x] **Story:** Sebagai user, saya ingin memfilter game berdasarkan genre
  **AC:**
  1. Ada dropdown/checkbox pilihan genre
  2. List game ter-update sesuai genre yang dipilih
  3. Bisa pilih lebih dari satu genre sekaligus
  **Points:** 3
  **Implemented:** Multi-select checkbox genre, query param genre[] ke API.

- [x] **Story:** Sebagai user, saya ingin memfilter game berdasarkan platform
  **AC:**
  1. Ada filter platform (Steam, Epic, dll)
  2. List game hanya menampilkan game yang tersedia di platform terpilih
  **Points:** 3
  **Implemented:** Dropdown platform, filter via whereHas di API.

- [x] **Story:** Sebagai user, saya ingin mengurutkan hasil pencarian
  **AC:**
  1. Ada opsi sort: harga terendah, harga tertinggi, diskon terbesar, terbaru
  2. Hasil ter-sort tanpa reload halaman
  **Points:** 2
  **Implemented:** Dropdown sort, SWR re-fetch on change (no page reload).

- [x] **Story:** Sebagai user, saya ingin melihat detail lengkap sebuah game
  **AC:**
  1. Halaman detail menampilkan deskripsi, screenshot, requirement sistem, dan harga per platform
  2. Data diambil dari database, bukan fetch langsung ke API eksternal
  **Points:** 5
  **Implemented:** GET /api/games/{id} + page /games/[id] + perbandingan harga berdampingan.

### Epic 2: Perbandingan Harga Multi-Platform

- [x] **Story:** Sebagai user, saya ingin membandingkan harga game yang sama di beberapa platform
  **AC:**
  1. Halaman detail game menampilkan harga dari tiap platform berdampingan
  2. Platform dengan harga termurah ditandai secara visual
  **Points:** 5
  **Implemented Sprint 2:** GET /api/games/{id} mengembalikan harga per platform; UI menampilkan berdampingan dan menandai platform termurah.

- [x] **Story:** Sebagai user, saya ingin mencari game berdasarkan harga & diskon
  **AC:**
  1. Ada filter rentang harga dan sorting "diskon terbesar"
  2. Hasil filter update tanpa reload halaman
  **Points:** 3
  **Implemented Sprint 2:** Filter min_price/max_price tervalidasi di Laravel; sorting diskon tersedia; UI update via SWR tanpa reload.

### Epic 3: Riwayat & Notifikasi Diskon

*Prasyarat: tabel `price_history` dan scheduler sync sudah berjalan minimal beberapa hari.*

- [ ] **Story:** Sebagai user, saya ingin melihat riwayat harga sebuah game
  **AC:**
  1. Halaman detail game menampilkan grafik harga (mis. 6 bulan terakhir)
  2. Data diambil dari histori harga tersimpan di database, bukan real-time fetch
  **Points:** 5

- [ ] **Story:** Sebagai user, saya ingin tahu apakah harga saat ini termasuk harga terendah historis
  **AC:**
  1. Sistem menampilkan label "Harga Terendah dalam X Bulan" jika kondisi terpenuhi
  2. Perhitungan berbasis data histori harga di database
  **Points:** 3

- [ ] **Story:** Sebagai user, saya ingin menerima notifikasi saat game di wishlist saya diskon
  **AC:**
  1. Sistem mengecek harga wishlist secara berkala (mis. tiap sync harga selesai)
  2. Notifikasi (email/in-app) terkirim saat harga turun dari harga sebelumnya
  3. User bisa menyalakan/mematikan notifikasi
  **Points:** 5

### Epic 4: Wishlist

*Prasyarat: sistem autentikasi user sudah berjalan.*

- [x] **Story:** Sebagai user, saya ingin menambahkan game ke wishlist
  **AC:**
  1. Ada tombol "Tambah ke Wishlist" di halaman detail/list game
  2. Sistem menyimpan game ke wishlist milik user yang login
  3. Game yang sudah ada di wishlist tombolnya berubah jadi "Hapus dari Wishlist"
  **Points:** 3
  **Implemented Sprint 4:** Tombol heart di GameCard, POST /api/wishlists, GET /api/wishlists/check/{gameId}, state inWishlist via SWR.

- [x] **Story:** Sebagai user, saya ingin melihat daftar game di wishlist saya
  **AC:**
  1. Ada halaman "Wishlist Saya" menampilkan semua game tersimpan
  2. Tiap item menampilkan harga saat ini & status diskon
  **Points:** 3
  **Implemented Sprint 4:** Halaman /wishlist dengan GET /api/wishlists, tampilkan game_title, harga termurah, status diskon, platform.

- [x] **Story:** Sebagai user, saya ingin menghapus game dari wishlist
  **AC:**
  1. Ada tombol hapus di halaman wishlist
  2. Game langsung hilang dari daftar tanpa reload manual
  **Points:** 2
  **Implemented Sprint 4:** Tombol hapus di /wishlist page, DELETE /api/wishlists/{id}; tombol toggle di GameCard, DELETE /api/wishlists/game/{gameId}, mutate SWR tanpa reload.

### Epic 5: Admin & Monitoring Data Sync

*Prasyarat: Laravel Scheduler + Queue untuk sync harga (lihat Section 3) sudah berjalan.*

- [x] **Story:** Sebagai admin, saya ingin melihat status sync data terakhir dari tiap sumber
  **AC:**
  1. Ada halaman/dashboard admin menampilkan waktu sync terakhir & status (sukses/gagal) per platform
  2. Jika gagal, pesan error dari `sync_logs` ditampilkan
  **Points:** 3
  **Implemented Sprint 2:** GET /api/admin/sync-logs dengan Sanctum + role admin, dashboard /admin, status/error/waktu per platform.

- [x] **Story:** Sebagai admin, saya ingin menerima alert saat proses sync data gagal
  **AC:**
  1. Notifikasi (email) terkirim ke admin saat job sync gagal berturut-turut melewati batas ambang (mis. 2x)
  2. Setiap kegagalan tercatat di tabel `sync_logs` untuk audit
  **Points:** 3
  **Implemented Sprint 4:** SyncFailureAlert notification (mail + database channel), logic di SyncPlatformPrices->checkConsecutiveFailuresAndAlert(), ambang 2x consecutive failures per platform.

---

## 13. Sprint Plan (Rekomendasi)

| Sprint | Epic | Points | Alasan |
|---|---|---|---|
| Sprint 1 | Epic 0 (Katalog Dasar) + Epic 1 (Search & Filter) | 21 | Fondasi, no-auth, langsung bisa di-demo |
| Sprint 2 | Epic 2 (Perbandingan Harga Multi-Platform) + Epic 5 (Admin & Monitoring) | 14 | Core value proposition; monitoring dibangun paralel begitu scheduler sync aktif |
| Sprint 3 | Epic 3 (Riwayat & Notifikasi Diskon) | 13 | Butuh data historis sudah ke-sync beberapa waktu |
| Sprint 4 | Epic 4 (Wishlist) | 8 | Butuh auth, ditaruh setelah fondasi notifikasi (Epic 3) siap |

*Catatan: Epic 5 (Admin & Monitoring) digabung ke Sprint 2 karena secara teknis bergantung pada scheduler sync yang sudah harus aktif sejak Sprint 1/2 — bukan karena prioritas bisnisnya tinggi. Sesuaikan urutan jika tim lebih nyaman membangun auth & wishlist lebih dulu.*
