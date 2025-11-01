# 💰 Kelola Kas Kelas - Class Cash Management System

Aplikasi web modern untuk mengelola kas kelas dengan mudah dan efisien. Dibangun dengan Next.js 14, TypeScript, Prisma, dan PostgreSQL.

**Versi**: 2.0  
**Status**: Production Ready ✅

## ✨ Fitur Utama

### 👥 Multi-Role System
- **Administrator**: Reset password dan kelola semua pengguna
- **Bendahara**: Kelola transaksi, tagihan, rekap, dan anggota
- **Anggota**: Lihat tagihan dan bayar kas mingguan

### 📊 Fitur Anggota
- Dashboard dengan ringkasan keuangan
- Lihat tagihan kas mingguan yang belum dibayar
- Klaim "Sudah Bayar" untuk notifikasi bendahara
- Lihat status verifikasi pembayaran
- Ganti password di halaman Settings

### 💼 Fitur Bendahara
- **Pencatatan Transaksi**: Catat uang masuk dan keluar dengan mudah
- **Rekap Keuangan**: Laporan lengkap pemasukan dan pengeluaran
- **Export Excel**: Download laporan keuangan dalam format Excel (4 worksheets)
- **Kelola Tagihan**: 
  - Buat tagihan kas mingguan untuk semua anggota
  - Auto-generate multiple tagihan sekaligus (bulk)
  - Verifikasi pembayaran yang diklaim anggota
- **Kelola Anggota**: Tambah dan hapus anggota kelas
- **Dashboard Notifikasi**: Lihat anggota yang menunggu verifikasi

### 🛡️ Fitur Administrator
- Reset password semua pengguna
- Kelola semua user dalam sistem

### 🔐 Fitur Umum (Semua User)
- **Ganti Password**: Ubah password sendiri di halaman Settings
- **Secure Authentication**: Login dengan NextAuth.js

### 📈 Fitur Laporan
- **Grouped Rekap**: Tagihan dikelompokkan per batch
- **Detail Pembayaran**: Siapa bayar, kapan, berapa
- **Export Excel**: Download dengan 4 worksheets terpisah
  - Rekap Kas (tagihan yang sudah dibayar)
  - Pemasukan Lainnya
  - Pengeluaran
  - Ringkasan (total & saldo)

## 🚀 Teknologi yang Digunakan

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Excel Export**: xlsx library
- **Deployment**: Vercel-ready

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (atau gunakan Supabase/Neon untuk hosting gratis)

### Setup

1. Clone repository
```bash
git clone <repository-url>
cd kelola-kas-kelas
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

Edit `.env` file dengan konfigurasi database Anda:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kelola-kas-kelas"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

4. Generate Prisma Client
```bash
npm run db:generate
```

5. Push database schema
```bash
npm run db:push
```

6. Seed initial admin user (optional)
```bash
npm run db:seed
```

Default admin credentials:
- Email: admin@kelas.local
- Password: admin123

⚠️ **Penting**: Ganti password default setelah login pertama kali!

7. Run development server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser

## 🗄️ Database Schema

### Users
- `id`: Primary key
- `email`: Unique identifier
- `name`: Nama lengkap
- `password`: Hashed password
- `role`: ADMINISTRATOR | BENDAHARA | ANGGOTA

### Transactions
- `id`: Primary key
- `amount`: Jumlah uang
- `type`: MASUK | KELUAR
- `description`: Keterangan
- `userId`: Foreign key ke User
- `createdAt`: Timestamp

### Bills
- `id`: Primary key
- `amount`: Jumlah tagihan
- `description`: Keterangan
- `dueDate`: Tanggal jatuh tempo
- `status`: PENDING | PAID | OVERDUE
- `userId`: Foreign key ke User
- `createdAt`, `updatedAt`: Timestamps

## 🚢 Deployment ke Vercel

### Langkah-langkah:

1. **Push kode ke GitHub**
```bash
git push origin main
```

2. **Import project ke Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Klik "Add New Project"
   - Import repository dari GitHub

3. **Setup Database**
   - Gunakan **Vercel Postgres** (free tier)
   - Atau gunakan **Supabase** / **Neon.tech** (gratis)

4. **Environment Variables**
   - `DATABASE_URL`: Connection string dari database provider
   - `NEXTAUTH_URL`: URL aplikasi (auto-set oleh Vercel)
   - `NEXTAUTH_SECRET`: Generate dengan `openssl rand -base64 32`

5. **Deploy**
   - Vercel akan auto-detect Next.js project
   - Setup build command akan otomatis

### Notes untuk Production:
- Selalu gunakan HTTPS
- Set NEXTAUTH_URL ke domain production
- Use strong NEXTAUTH_SECRET
- Setup backup database rutin

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Build untuk production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema ke database
npm run db:seed      # Seed initial data
```

## 🔒 Security Features

- Password hashing dengan bcryptjs
- Session-based authentication
- Role-based access control (RBAC)
- Protected API routes
- Secure database queries dengan Prisma

## 📱 Preview

### Login Page
Modern login interface dengan validasi form

### Dashboard
- Ringkasan keuangan (Saldo, Pemasukan, Pengeluaran)
- Quick actions berdasarkan role
- Real-time statistics

### Transaksi Management
- Form untuk catat masuk/keluar
- Edit dan hapus transaksi
- Real-time balance calculation

### Tagihan System
- Buat tagihan untuk anggota
- Tracking status pembayaran
- Notifikasi overdue

## 🤝 Contributing

Pull requests are welcome! Untuk major changes, buka issue terlebih dahulu.

## 📄 License

MIT License

## 👨‍💻 Author

Developed by [Your Name]

---

Made with ❤️ using Next.js
