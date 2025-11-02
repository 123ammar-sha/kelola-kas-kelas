// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getFirstName(fullName: string): string {
  // Ambil kata pertama dari nama (nama depan)
  return fullName.split(' ')[0].toLowerCase();
}

async function main() {
  // Hash password default
  const defaultPassword = 'inforumuka24';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Data ANGGOTA dengan email nama depan saja
  const anggotaData = [
    { name: 'Siti Nur Jannah', email: 'siti@infor24' },
    { name: 'Safitri Sukma Pertiwi', email: 'safitri@infor24' },
    { name: 'Septyani Dwi Susanti', email: 'septyani@infor24' },
    { name: 'Ammar Shafiy', email: 'ammar@infor24' },
    { name: 'Andika Putro Nugroho', email: 'andika@infor24' },
    { name: 'Aisyah Nur Khasanah', email: 'aisyah@infor24' },
    { name: 'Amanda Nadhi Fah Nisa', email: 'amanda@infor24' },
    { name: 'Danang Febrianto', email: 'danang@infor24' },
    { name: 'Indi Kristyanti', email: 'indi@infor24' },
    { name: 'Ahmad Yusuf Briliyanto', email: 'ahmad@infor24' },
    { name: 'Gizza Septiana Salsabila', email: 'gizza@infor24' },
    { name: 'Rindi Fitria Lestari', email: 'rindi@infor24' },
    { name: 'Mauliddina Halimatus Lathifah', email: 'mauliddina@infor24' },
    { name: 'Mursyid Al Fathoni', email: 'mursyid@infor24' },
    { name: 'Wili Indrayani', email: 'wili@infor24' },
    { name: 'Amr Qadir Rahman', email: 'amr@infor24' },
    { name: 'Anggun Wulandari', email: 'anggun@infor24' },
    { name: 'Gandi Surya Tri Atmaja', email: 'gandi@infor24' },
    { name: 'Fais Abimanyu Setiawan', email: 'fais@infor24' },
    { name: 'Mufti Nasrul Amin', email: 'mufti@infor24' },
    { name: 'Ihsandy Wahyu Dirgantara', email: 'ihsandy@infor24' }
  ];

  console.log('🚀 Starting import of ANGGOTA users...');
  console.log('📧 Email format: nama-depan@infor24');

  // Insert data dengan upsert (avoid duplicates)
  for (const user of anggotaData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // Jika sudah ada, tidak update apa-apa
      create: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: 'ANGGOTA',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Imported: ${user.name} (${user.email})`);
  }

  console.log('🎉 All ANGGOTA users imported successfully!');
  console.log(`📊 Total users imported: ${anggotaData.length}`);
  console.log('🔐 Default password for all: inforumuka24');
  console.log('👤 You can login with any account using:');
  console.log('   Email: nama-depan@infor24');
  console.log('   Password: inforumuka24');
}

main()
  .catch((e) => {
    console.error('❌ Error importing users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });