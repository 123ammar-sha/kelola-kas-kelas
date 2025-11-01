# 🚀 Next Steps - Setup Neon DB & Run Application

Panduan lengkap langkah-langkah setelah login ke Neon DB.

## 📋 Prerequisites Checklist

- [x] Node.js sudah terinstall
- [x] Next.js project sudah dibuat
- [x] Sudah login/create account di Neon.tech
- [ ] Database Neon sudah dibuat
- [ ] Connection string sudah didapat

---

## 🎯 STEP-BY-STEP GUIDE

### **STEP 1: Buat Database di Neon**

1. Login ke https://neon.tech
2. Klik **"New Project"** atau **"Create Project"**
3. Isi informasi project:
   - **Project Name**: `kelola-kas-kelas`
   - **Region**: Pilih yang paling dekat (singapore: `aws-ap-southeast-1`)
   - **PostgreSQL Version**: 16 atau 15 (recommended)
4. Klik **"Create Project"**
5. Tunggu hingga project selesai dibuat (1-2 menit)

### **STEP 2: Dapatkan Connection String**

1. Di dashboard Neon, cari section **"Connection Details"**
2. Copy **connection string** yang ada disana
   - Formatnya seperti ini:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. **PENTING**: Copy connection string yang **PENUH/LENGKAP** dengan password!

### **STEP 3: Setup Environment File**

1. Buka terminal di folder project
2. Copy file `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit file `.env` dengan text editor:
   ```bash
   nano .env
   # atau
   code .env
   # atau gunakan editor apapun yang ada
   ```

4. **Paste connection string** dari Neon ke `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

5. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   
   Copy hasilnya dan paste ke `NEXTAUTH_SECRET` di file `.env`

6. Save file `.env`

### **STEP 4: Install Dependencies**

```bash
npm install
```

Tunggu hingga semua package terinstall (sekitar 2-5 menit).

### **STEP 5: Generate Prisma Client**

```bash
npm run db:generate
```

Ini akan generate Prisma Client untuk berinteraksi dengan database.

### **STEP 6: Push Schema ke Neon Database**

```bash
npm run db:push
```

Ini akan membuat tabel-tabel di database Neon:
- users
- transactions
- bills

### **STEP 7: Seed Initial Data**

```bash
npm run db:seed
```

Ini akan membuat user default untuk testing:
- ✅ Admin user
- ✅ Bendahara user
- ✅ 3 Anggota users
- ✅ Sample transactions

Output yang muncul:
```
✅ Admin created: admin@kelas.local
✅ Bendahara created: bendahara@kelas.local
✅ Member created: anggota1@kelas.local
✅ Member created: anggota2@kelas.local
✅ Member created: anggota3@kelas.local
✅ Sample transactions created

🎉 Seeding completed!
```

### **STEP 8: Jalankan Development Server**

```bash
npm run dev
```

Output yang muncul:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xs
```

### **STEP 9: Buka Aplikasi di Browser**

1. Buka browser
2. Kunjungi: **http://localhost:3000**
3. Akan redirect otomatis ke halaman login

### **STEP 10: Login dengan Credentials Default**

Anda bisa login sebagai 3 role berbeda:

#### 👑 **Administrator**
```
Email:    admin@kelas.local
Password: admin123
```
**Fitur**: Reset password, kelola semua user

#### 💰 **Bendahara**
```
Email:    bendahara@kelas.local
Password: bendahara123
```
**Fitur**: Catat transaksi, buat tagihan, kelola anggota, lihat rekap

#### 👤 **Anggota**
```
Email:    anggota1@kelas.local
Password: anggota123
```
**Fitur**: Lihat tagihan, bayar kas

---

## ✅ Verify Setup Berhasil

Jika semua berjalan dengan baik, Anda akan melihat:

1. ✅ **Halaman Login** - Beautiful gradient background
2. ✅ **Database Connected** - Tidak ada error connection
3. ✅ **Login Success** - Redirect ke dashboard
4. ✅ **Dashboard Loaded** - Statistics muncul
5. ✅ **Navigation Working** - Sidebar bisa diklik

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

**Solusi**: Install dependencies lagi
```bash
npm install
```

### Error: "Connection refused" atau database error

**Solusi**:
1. Cek `.env` file - pastikan DATABASE_URL benar
2. Test connection string di Neon dashboard
3. Cek apakah sslmode=require ada di connection string

### Error: "Prisma schema not found"

**Solusi**: Generate Prisma client
```bash
npm run db:generate
```

### Error: "Table already exists"

**Solusi**: Reset database (⚠️ HAPUS SEMUA DATA)
```bash
npx prisma migrate reset
npm run db:seed
```

Atau kalau hanya ingin push schema baru:
```bash
npm run db:push --force-reset
```

### Error: "Port 3000 already in use"

**Solusi**: Gunakan port lain
```bash
npm run dev -- -p 3001
```

Atau matikan process yang menggunakan port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

---

## 🎉 Next Steps Setelah Berhasil

1. **Explore Aplikasi**:
   - Login sebagai Admin, lihat fitur reset password
   - Login sebagai Bendahara, buat transaksi & tagihan
   - Login sebagai Anggota, lihat tagihan

2. **Ganti Password Default**:
   - ⚠️ **PENTING**: Ganti semua password default!
   - Aplikasi punya fitur reset password untuk admin

3. **Test Fitur**:
   - Buat transaksi masuk/keluar
   - Buat tagihan untuk anggota
   - Bayar tagihan sebagai anggota
   - Lihat rekap keuangan

4. **Deploy ke Vercel** (Optional):
   - Push code ke GitHub
   - Connect ke Vercel
   - Setup environment variables (DATABASE_URL dari Neon)
   - Deploy!

---

## 📝 Checklist Selesai

- [ ] Neon database created
- [ ] Connection string copied
- [ ] `.env` file configured
- [ ] Dependencies installed
- [ ] Prisma client generated
- [ ] Schema pushed to Neon
- [ ] Data seeded
- [ ] Dev server running
- [ ] Login successful
- [ ] Dashboard loaded
- [ ] Features tested

---

## 🆘 Butuh Bantuan?

Jika masih ada masalah:

1. Cek terminal untuk error messages
2. Baca `SETUP.md` untuk troubleshooting detail
3. Cek Neon dashboard - pastikan database aktif
4. Cek `.env` file - pastikan format benar

---

**Selamat! Aplikasi Anda sudah siap digunakan! 🎉**

