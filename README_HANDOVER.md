# GameHub — Paket Handover

Paket ini berisi source code GameHub: Laravel backend + Next.js frontend.

## Requirements

- PHP 8.2+
- Composer
- Node.js 20+ dan npm
- SQLite (default) atau MySQL/MariaDB

## 1. Backend Laravel

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Default API: http://127.0.0.1:8000/api

Catatan: `backend/.env.example` memakai SQLite agar setup paling mudah. Untuk memakai XAMPP/MySQL, ubah DB_* di `.env`, lalu jalankan migrate dan seed.

Demo login:
- User: user@gamehub.test
- Password: password

Admin:
- User: admin@gamehub.test
- Password: password

## 2. Frontend Next.js

Buka terminal kedua:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3001

API base default frontend: http://127.0.0.1:8000/api
Jika backend memakai URL lain, buat `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

## 3. Fitur utama

- Katalog game, search, sort, filter platform dan genre
- Detail game dan perbandingan harga
- Login dan wishlist
- Dashboard admin sync log
- UI dark gaming dengan harga tampilan Rupiah

## Catatan data

Data demo berasal dari seeder. Integrasi sinkronisasi CheapShark/Steam tersedia di backend dan membutuhkan queue/scheduler bila ingin menjalankannya.

## Isi paket

Dependency besar seperti `node_modules`, `vendor`, dan `.next` sengaja tidak disertakan. Jalankan `npm install` dan `composer install` di PC penerima. File `.env` dan secret juga tidak disertakan.
