# 🚀 Panduan Setup Kelola Kas Kelas

Panduan lengkap untuk setup dan deployment aplikasi Kelola Kas Kelas.

## 📋 Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:

- **Node.js** 18.0.0 atau lebih baru
- **npm** atau **yarn** package manager
- **PostgreSQL** database (atau akun Supabase/Neon)

### Cara Install Node.js

**Windows/Mac:**
- Download dari https://nodejs.org/
- Pilih LTS version

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node --version
npm --version
```

## 🗄️ Setup Database

### Opsi 1: PostgreSQL Lokal

1. Install PostgreSQL:
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Mac (dengan Homebrew)
brew install postgresql
brew services start postgresql

# Windows: Download dari postgresql.org
```

2. Buat database:
```bash
sudo -u postgres psql

CREATE DATABASE "kelola-kas-kelas";
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE "kelola-kas-kelas" TO your_username;
\q
```

### Opsi 2: Supabase (Gratis)

1. Buat akun di https://supabase.com
2. Create new project
3. Copy database connection string dari Settings > Database
4. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`

### Opsi 3: Neon.tech (Gratis)

1. Buat akun di https://neon.tech
2. Create new project
3. Copy connection string
4. Format: `postgresql://[user]:[password]@[endpoint]/[dbname]`

## ⚙️ Installation Steps

### 1. Install Dependencies

```bash
npm install
```

Atau dengan yarn:
```bash
yarn install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit file `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kelola-kas-kelas"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-your-secret-here"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database
npm run db:push
```

### 4. Seed Initial Data

```bash
npm run db:seed
```

Ini akan membuat user default:
- **Admin**: admin@kelas.local / admin123
- **Bendahara**: bendahara@kelas.local / bendahara123  
- **Anggota**: anggota1@kelas.local / anggota123

⚠️ **PENTING**: Ganti password setelah login pertama!

### 5. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000 di browser.

## 🎯 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd kelola-kas-kelas

# Install dependencies
npm install

# Setup .env
cp .env.example .env
# Edit .env dengan database credentials Anda

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start development
npm run dev
```

## 🚢 Deployment ke Vercel

### Persiapan

1. Push kode ke GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <github-repo-url>
git push -u origin main
```

### Deploy di Vercel

1. **Sign up/login ke Vercel**: https://vercel.com

2. **Import Project**:
   - Klik "Add New Project"
   - Pilih repository GitHub Anda
   - Klik "Import"

3. **Setup Environment Variables**:
   - `DATABASE_URL`: Connection string dari database provider
   - `NEXTAUTH_URL`: Akan auto-set oleh Vercel
   - `NEXTAUTH_SECRET`: Generate dengan `openssl rand -base64 32`

4. **Deploy**:
   - Vercel auto-detect Next.js
   - Klik "Deploy"

### Setup Database untuk Production

**Opsi 1: Vercel Postgres**
- Integrate langsung dari dashboard Vercel
- Copy connection string ke `DATABASE_URL`

**Opsi 2: Supabase**
- Buat project baru
- Settings > Database > Connection string
- Paste ke environment variable di Vercel

**Opsi 3: Neon.tech**
- Buat project baru
- Copy connection string
- Paste ke environment variable di Vercel

### Post-Deploy Steps

Setelah deployment berhasil:

1. **Setup database**:
```bash
# SSH ke Vercel atau gunakan Vercel CLI
vercel env pull

# Run migrations
npm run db:push

# Seed data
npm run db:seed
```

2. **Verifikasi**:
   - Buka URL production Anda
   - Test login dengan admin credentials
   - Ganti password default

## 📁 Project Structure

```
kelola-kas-kelas/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── tagihan/           # Bill components
│   ├── transaksi/         # Transaction components
│   └── ui/                # UI components
├── lib/                   # Utilities
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Helper functions
├── prisma/                # Database
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── .env.example           # Environment template
├── next.config.mjs        # Next.js config
├── package.json           # Dependencies
└── README.md             # Documentation
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check database is running
pg_isready

# Test connection
psql -U your_user -d kelola-kas-kelas

# Check .env file
cat .env | grep DATABASE_URL
```

### Prisma Issues

```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (HAPUS SEMUA DATA!)
npx prisma migrate reset

# Or just push schema
npm run db:push
```

### NextAuth Issues

```bash
# Check NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET

# Regenerate secret
openssl rand -base64 32
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build again
npm run build
```

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Use strong NEXTAUTH_SECRET in production
- [ ] Enable HTTPS (auto di Vercel)
- [ ] Setup database backups
- [ ] Review environment variables
- [ ] Enable rate limiting (if needed)
- [ ] Setup monitoring/logging

## 📞 Support

Jika ada masalah:

1. Check error logs di terminal
2. Review documentation di README.md
3. Search GitHub Issues
4. Create new issue dengan error details

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Selamat menggunakan Kelola Kas Kelas! 🎉**
