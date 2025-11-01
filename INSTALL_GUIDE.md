# 🚀 Panduan Install & Setup dengan Neon DB

## 📋 Langkah-langkah Lengkap

### 1️⃣ Install Node.js (Jika Belum Ada)

**Pilih salah satu cara:**

#### Cara 1: Menggunakan NVM (Recommended)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal atau jalankan:
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verifikasi
node --version  # Harus menampilkan v20.x.x
npm --version
```

#### Cara 2: Install Langsung (Ubuntu/Debian)
```bash
# Butuh password sudo
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node --version
npm --version
```

#### Cara 3: Download dari Website
- Download dari: https://nodejs.org/
- Install sesuai OS Anda
- Verifikasi instalasi

---

### 2️⃣ Install Dependencies Project

Setelah Node.js terinstall:

```bash
# Pastikan Anda di folder project
cd /home/ammar/Data/Project/kelola-kas-kelas

# Install semua dependencies
npm install

# Tunggu hingga selesai (biasanya 1-2 menit)
```

---

### 3️⃣ Setup Neon Database

#### A. Buat Database di Neon (Jika Belum)

1. Buka https://neon.tech
2. Login ke akun Anda
3. Klik "Create Project"
4. Isi nama project: `kelola-kas-kelas`
5. Pilih region terdekat (Singapore recommended)
6. Klik "Create Project"

#### B. Ambil Connection String

1. Setelah project dibuat, klik pada nama project
2. Di sidebar, klik "Connection Details"
3. Pilih driver: **PostgreSQL**
4. Copy connection string yang berbentuk:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

⚠️ **PENTING**: Jangan share connection string ini ke siapa pun!

---

### 4️⃣ Setup Environment Variables

#### A. Buat File .env

```bash
cd /home/ammar/Data/Project/kelola-kas-kelas

# Copy dari template
cp .env.example .env

# Edit file .env
nano .env
# atau
code .env  # jika pakai VS Code
```

#### B. Isi Environment Variables

Edit file `.env` dengan content berikut:

```env
# Database Connection - Paste connection string dari Neon
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-secret-key-here"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Copy hasilnya ke `NEXTAUTH_SECRET` di file `.env`.

**Contoh lengkap .env:**
```env
DATABASE_URL="postgresql://neondb_owner:abc123xyz@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kL9mP2nR5sT8vW1yZ4bC7eF0hJ3kM6qS9tV2wX5zA8dG1="
```

**Simpan file** (Ctrl+X, Y, Enter jika pakai nano)

---

### 5️⃣ Setup Database Schema

Sekarang kita perlu membuat tabel-tabel di database Neon:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database Neon
npm run db:push

# Tunggu hingga selesai...
# Akan muncul: "Database synchronized successfully"
```

✅ **Verifikasi**: Cek di Neon dashboard → Tables, harus ada:
- `users`
- `transactions`
- `bills`

---

### 6️⃣ Seed Initial Data

Import data awal (default users):

```bash
npm run db:seed
```

Output yang harus muncul:
```
🌱 Seeding database...
✅ Admin created: admin@kelas.local
✅ Bendahara created: bendahara@kelas.local
✅ Member created: anggota1@kelas.local
✅ Member created: anggota2@kelas.local
✅ Member created: anggota3@kelas.local
✅ Sample transactions created

🎉 Seeding completed!
```

---

### 7️⃣ Jalankan Aplikasi

```bash
npm run dev
```

Output yang harus muncul:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

✅ **Buka browser** dan akses: http://localhost:3000

---

### 8️⃣ Login ke Aplikasi

**Gunakan salah satu credentials default:**

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@kelas.local | admin123 |
| Bendahara | bendahara@kelas.local | bendahara123 |
| Anggota | anggota1@kelas.local | anggota123 |

⚠️ **PENTING**: Ganti password ini setelah login pertama!

---

## 🎉 Selamat! Aplikasi Berjalan!

Sekarang Anda bisa:
- ✅ Login sebagai Administrator/Bendahara/Anggota
- ✅ Lihat dashboard
- ✅ Catat transaksi
- ✅ Buat tagihan
- ✅ Kelola anggota
- ✅ Lihat rekap

---

## ❌ Troubleshooting

### Error: "Cannot find module 'react'"
**Solusi**: Install dependencies
```bash
npm install
```

### Error: "Environment variable DATABASE_URL is missing"
**Solusi**: Pastikan file `.env` sudah dibuat dan berisi `DATABASE_URL`

### Error: "Connection refused" atau "Database error"
**Solusi**: 
1. Cek connection string di `.env` apakah benar
2. Pastikan Neon project sudah dibuat
3. Coba generate ulang Prisma Client:
   ```bash
   npm run db:generate
   npm run db:push
   ```

### Error: "NEXTAUTH_SECRET is not defined"
**Solusi**: Generate dan tambahkan NEXTAUTH_SECRET ke `.env`
```bash
openssl rand -base64 32
```

### Port 3000 already in use
**Solusi**: 
```bash
# Cek apa yang menggunakan port 3000
lsof -i :3000

# Kill process (ganti PID dengan angka yang muncul)
kill -9 PID

# Atau ganti port
PORT=3001 npm run dev
```

---

## 🚀 Next Steps

Setelah aplikasi berjalan lokal, langkah selanjutnya:

1. **Customize aplikasi**
   - Ganti nama project
   - Ubah warna theme
   - Tambahkan fitur

2. **Deploy ke Production**
   - Push ke GitHub
   - Deploy ke Vercel
   - Setup database production

Untuk panduan deploy, lihat: `SETUP.md`

---

## 📞 Need Help?

Jika ada masalah:
1. Cek error message di terminal
2. Lihat `Troubleshooting` section di atas
3. Baca `SETUP.md` untuk panduan detail
4. Cek logs di Neon dashboard

Selamat menggunakan Kelola Kas Kelas! 🎉
