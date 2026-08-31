# JakMall Product Scraper & Shopee Listing Automation

> **Proof of Concept (PoC) Technical Assessment — Buruh Ketik**
> 
> *Fullstack Software Developer Candidate Assessment*

Aplikasi otomatisasi *end-to-end* untuk mengekstrak katalog produk dari **JakMall**, melakukan normalisasi data dan penyesuaian markup margin, serta meneruskan data listing ke **Shopee Seller Center** menggunakan **Playwright Browser Automation** dan **Shopee Mass Upload (.xlsx) Generator**.

---

## 1. Arsitektur & Alur Kerja Sistem (Workflow)

```
[ Input URL JakMall ]
        │
        ▼
[ Multi-Tier Scraper ] ───► (1. Axios/Cheerio Fast JSON-LD & DOM Parser)
        │                   (2. Playwright Chromium Dynamic Renderer Fallback)
        ▼
[ Smart Normalizer ]  ───►  - Pemetaan Kategori & Atribut Shopee
        │                   - Sanitasi Judul (Max 120 Karakter)
        │                   - Rumus Markup Margin: (Harga × (1 + %)) + Biaya Admin
        │                   - Formatting Deskripsi Terstruktur & Gambar Galeri
        ▼
[ Staging UI & Editor ]───► Pengguna dapat mereview dan mengedit data sebelum publish
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[ Playwright Shopee Bot ]   [ Shopee Mass Upload Excel ]
   │                             │
   ▼                             ▼
(Simulasi Otomasi Input       (File .xlsx Resmi Siap Upload
 Form Seller Center +          ke Seller Center)
 Screenshot Verifikasi)
```

---

## 2. Tech Stack & Dependencies

Seluruh teknologi yang dipilih **100% Open Source / Bebas Biaya (Rp 0 / Zero-Cost)**:

- **Framework**: [Next.js 14/15 (App Router)](https://nextjs.org/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Scraping Engine**:
  - `cheerio` & `axios`: Fast parsing untuk HTML statis, OpenGraph, dan skema JSON-LD.
  - `playwright`: Automasi browser Chromium untuk rendering dinamis & anti-bot bypass.
- **Shopee Integration**:
  - `playwright`: Bot automasi input form di dashboard Shopee Seller Center.
  - `xlsx`: Pembuat file Excel template standar Mass Upload Shopee.
- **Storage & State**: Local File-based Persistent JSON Storage (`data/products.json`).

---

## 3. Panduan Instalasi & Menjalankan Project

### Prasyarat:
- Node.js versi 18+ atau 20+ (LTS)
- NPM atau PNPM

### Langkah Menjalankan:

1. **Clone repository & masuk ke direktori**:
   ```bash
   git clone <repo-url>
   cd jakkmall
   ```

2. **Install dependensi & browser Playwright**:
   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Jalankan aplikasi (Development Mode)**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di browser pada: **`http://localhost:3000`**

4. **Menjalankan versi Production (Build & Start)**:
   ```bash
   npm run build
   npm run start
   ```

---

## 4. Konfigurasi Supabase & Deployment ke Vercel

Aplikasi ini telah siap di-deploy ke **Vercel** dengan database cloud **Supabase PostgreSQL** (atau tetap berjalan dengan Local JSON jika berjalan di laptop).

### A. Langkah Setup Supabase (Cloud Database):
1. Buat project baru gratis di [Supabase](https://supabase.com/).
2. Buka menu **SQL Editor** pada dashboard Supabase dan jalankan script yang ada di file [`supabase/schema.sql`](supabase/schema.sql).
3. Salin **Project URL** dan **Anon Key** dari menu `Project Settings > API`.
4. Buat file `.env.local` di komputer Anda (atau tambahkan di Environment Variables Vercel):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### B. Langkah Deploy ke Vercel:
1. Push repository ini ke **GitHub / GitLab**.
2. Masuk ke [Vercel](https://vercel.com/) dan pilih **Add New > Project**.
3. Import repository project `jakkmall`.
4. Pada bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` = (URL Supabase Anda)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Anon Key Supabase Anda)
5. Klik **Deploy**. Aplikasi akan online dan aktif dalam hitungan detik!

---

## 5. Fitur Utama

1. **Ekstraksi Produk JakMall (Single / Multiple URL)**:
   - Mengambil nama produk, deskripsi, harga modal, gambar utama & galeri, variasi produk (warna, ukuran), SKU, stok, dan berat/dimensi.
   - Dilengkapi preset demo 1-klik untuk pengujian instan.
2. **Kalkulator Markup Harga & Margin Dinamis**:
   - Konfigurasi persentase margin keuntungan (contoh: 15%) dan fixed admin fee (contoh: Rp 2.500).
3. **Staging Area & Quick Editor**:
   - UI responsif untuk melihat hasil ekstraksi sebelum diterbitkan.
   - Kemampuan mengubah harga, judul, atau deskripsi langsung dari modal editor.
4. **Dual Publishing Channel ke Shopee**:
   - **Playwright Automation Bot**: Mengisi form produk di Shopee Seller Center secara otomatis dengan log terminal interaktif dan bukti tangkapan layar (*proof of result*).
   - **Shopee Mass Upload Excel Generator**: Menghasilkan file `.xlsx` format resmi Shopee untuk fitur Mass Upload Seller Center.

---

## 6. Estimasi Biaya Operasional (Cost Breakdown)

| Komponen | Solusi Digunakan | Biaya (IDR) |
| :--- | :--- | :--- |
| **Server / Compute** | Local / Self-Hosted VPS (Vercel Free Tier / Railway) | **Rp 0** |
| **Scraper API** | Self-hosted Cheerio + Playwright Chromium | **Rp 0** |
| **Integrasi Shopee** | Playwright Bot & Mass Upload Excel Generator | **Rp 0** |
| **Database** | Supabase Cloud Database (Free Tier) / Local Storage | **Rp 0** |
| **Total Biaya Operasional** | | **Rp 0 (100% Gratis)** |

---

## 7. Limitasi Saat Ini & Pengembangan ke Tahap Production

### Limitasi Saat Ini (PoC):
1. **Shopee OTP / 2FA**: Sesi login Shopee membutuhkan OTP jika login dari IP/perangkat baru. Solusi saat ini menggunakan otomasi sesi dan fallback file Mass Upload Excel resmi.
2. **Kategori Mapping Otomatis**: Saat ini menggunakan deteksi kata kunci dan default category Shopee ID `100012`.

### Roadmap Menuju Production-Scale:
1. **Shopee Open Platform Official API**: Mendaftarkan aplikasi ke Shopee Open Platform Partner API untuk sinkronisasi pesanan & stok otomatis dua arah.
2. **Background Queue & Workers**: Menggunakan BullMQ + Redis untuk penjadwalan batch scraping ribuan URL sekaligus tanpa membebani thread server.
3. **Session Cookie Sync**: Fitur login browser satu kali untuk menyimpan `storageState.json` Playwright agar bot tidak meminta login berulang.
4. **Cloudflare Proxy Rotator**: Menambahkan rotating proxy jika scraping dilakukan pada skala jutaan request per hari.

---

## 8. Catatan Pembuatan (Human vs AI Collaboration)

- **Manual Engineering & Architecture**: Desain alur data end-to-end, normalisasi skema produk JakMall ke Shopee, integrasi Playwright, template builder Excel, dan UI/UX design.
- **AI-Assisted Development**: Mempercepat penulisan boilerplate code, TypeScript type definitions, dan formatting dokumentasi.
