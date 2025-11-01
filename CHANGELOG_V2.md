# 📝 Changelog V2.0 - Fitur Tambahan

## ✨ Fitur Baru yang Ditambahkan

### 1. **Ganti Password untuk Semua User** ✅
**Fitur**: Form ganti password di halaman Settings

**Detail**:
- Tersedia untuk semua role (Administrator, Bendahara, Anggota)
- Validasi password lama
- Konfirmasi password baru
- Toggle show/hide password
- Success message setelah berhasil

**File**:
- `components/settings/change-password-form.tsx`
- `app/api/auth/change-password/route.ts`

---

### 2. **Klaim Sudah Bayar + Verifikasi Bendahara** ✅
**Fitur**: Workflow pembayaran dengan verifikasi

**Detail**:
- Anggota bisa klik "Sudah Bayar" untuk claim
- Status berubah ke "CLAIMED_PAID" (Menunggu Verifikasi)
- Bendahara melihat badge biru sebagai pengingat
- Bendahara klik "Verifikasi" untuk konfirmasi
- Auto create transaction MASUK ke rekap

**Database**:
```prisma
enum BillStatus {
  PENDING
  CLAIMED_PAID  // Baru!
  PAID
  OVERDUE
}
```

**UI**:
- Anggota: Tombol "Sudah Bayar" di tagihan pending
- Anggota: Status card "Menunggu Verifikasi" (biru)
- Bendahara: Badge biru "Menunggu Verifikasi" dengan animasi pulse
- Bendahara: Tombol "Verifikasi" untuk konfirmasi

**File**:
- `app/api/bills/[id]/claim-paid/route.ts`
- `components/tagihan/tagihan-page-client.tsx` (updated)

---

### 3. **Buat Tagihan Otomatis (Bulk)** ✅
**Fitur**: Generate multiple tagihan sekaligus untuk beberapa minggu

**Detail**:
- Checkbox "Auto buat untuk N minggu"
- Input jumlah minggu (1-12)
- Otomatis generate tagihan untuk semua anggota
- Due date auto-increment per minggu
- Description auto-append "Minggu X"
- Setiap minggu punya batch ID terpisah

**Contoh**:
- Kas minggu ke-1 - Minggu 1
- Kas minggu ke-1 - Minggu 2
- Kas minggu ke-1 - Minggu 3
- Kas minggu ke-1 - Minggu 4

**File**:
- `app/api/bills/route.ts` (updated)
- `components/tagihan/tagihan-page-client.tsx` (updated)

---

### 4. **Export Rekap ke Excel** ✅
**Fitur**: Download laporan keuangan dalam format Excel

**Detail**:
- Multiple worksheets dalam 1 file
- Format rapi dengan tabel yang terorganisir
- Separation antara kas dan pemasukan lain
- Separation antara pemasukan dan pengeluaran
- Summary sheet dengan total

**Sheet Structure**:
1. **Rekap Kas**: Detail tagihan kas yang sudah dibayar
   - Tanggal, Keterangan, Anggota, Jumlah
   - Subtotal per batch kas
2. **Pemasukan Lain**: Transaksi masuk selain kas
3. **Pengeluaran**: Semua transaksi keluar
4. **Ringkasan**: Total pemasukan, pengeluaran, saldo

**File**:
- `app/api/export/rekap/route.ts`
- `components/rekap/export-button.tsx`

---

## 🔧 Technical Changes

### Database Schema
```prisma
// Added new status
enum BillStatus {
  PENDING
  CLAIMED_PAID  // NEW
  PAID
  OVERDUE
}
```

### Dependencies Added
```json
{
  "xlsx": "^0.18.5"  // For Excel export
}
```

### API Endpoints Added
- `POST /api/auth/change-password` - Change password
- `POST /api/bills/[id]/claim-paid` - Claim already paid
- `GET /api/export/rekap` - Export to Excel

### API Endpoints Modified
- `POST /api/bills` - Added `weeksCount` parameter for bulk creation

---

## 📊 Statistics

**Total Files Created**: 5
**Total Files Modified**: 6
**Lines of Code Added**: ~700+
**Features Added**: 4 major features

---

## 🎯 Workflow Improvements

### Workflow Pembayaran (Lama vs Baru)
**Lama**:
1. Bendahara buat tagihan
2. Anggota langsung bayar
3. Bendahara verifikasi

**Baru**:
1. Bendahara buat tagihan
2. Anggota claim "Sudah Bayar" → Status CLAIMED_PAID
3. Bendahara lihat pengingat badge
4. Bendahara verifikasi → Auto masuk rekap

### Workflow Buat Tagihan (Lama vs Baru)
**Lama**:
1. Buat 1 tagihan per kali submit

**Baru**:
1. Buat N tagihan sekaligus (1-12 minggu)
2. Auto-increment due date
3. Auto-append minggu ke-X

---

## 🐛 Bug Fixes
- None in this release (V2.0)

---

## 📝 Migration Notes

### For Users
1. No action required
2. All existing data preserved
3. New features available immediately

### For Developers
1. Run `npm install` to get xlsx library
2. Run `npm run db:push` to update schema
3. Run `npm run db:generate` to regenerate Prisma client

---

## 🔜 Future Enhancements (Ide)

- [ ] Notifikasi email untuk tagihan baru
- [ ] Notifikasi email untuk reminder jatuh tempo
- [ ] Dashboard analytics dengan charts
- [ ] Export PDF selain Excel
- [ ] Template tagihan untuk recurring (bulanan, semester, dll)
- [ ] Approval workflow untuk pengeluaran besar
- [ ] Multi-currency support
- [ ] Mobile app

---

## 📚 Documentation

See also:
- `README.md` - Project overview
- `SETUP.md` - Setup guide
- `PROJECT_INFO.md` - Technical details
- `CHANGELOG.md` - V1.0 changelog
- `NEXT_STEPS.md` - Post-installation guide

---

**Version**: 2.0  
**Release Date**: $(date +"%d-%m-%Y")  
**Author**: Development Team  
**Compatibility**: Next.js 14, Node.js 18+

