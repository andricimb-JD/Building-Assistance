import { Company, Permit, LKPMRecord, WarningLetter, EmailLog, ComplianceLogEvent, UserAccount } from '../types';

// Helper to get relative ISO date string (YYYY-MM-DD)
export const getRelativeDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-superadmin',
    name: 'Super Administrator',
    username: 'superadmin',
    password: 'superadmin123',
    email: 'superadmin@kepatuhanplus.id',
    role: 'superadmin',
    roleTitle: 'Super Admin',
    description: 'Kewenangan Tertinggi: Menambah & Menghapus User Petugas, Koordinator, dan Monitoring serta Mengatur Hak Akses.',
    avatarColor: 'bg-purple-600'
  },
  {
    id: 'user-koordinator',
    name: 'Andri Wicaksono',
    username: 'koordinator',
    password: 'koordinator123',
    email: 'andri.cimb@gmail.com',
    role: 'koordinator',
    roleTitle: 'User Koordinator',
    description: 'Kewenangan: Dashboard Eksekutif, Komparasi Kepatuhan NIB, Surat Teguran Resmi, & Notifikasi Email.',
    avatarColor: 'bg-sky-600'
  },
  {
    id: 'user-petugas',
    name: 'Budi Santoso',
    username: 'petugas',
    password: 'petugas123',
    email: 'budi.petugas@corp.co.id',
    role: 'petugas',
    roleTitle: 'User Petugas',
    description: 'Kewenangan: Hanya Upload Data Dokumen Perizinan dan Pelaporan LKPM Saja (Excel/CSV).',
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'user-monitor',
    name: 'Dr. Hendra Wijaya',
    username: 'monitor',
    password: 'monitor123',
    email: 'monitor.audit@kepatuhanplus.id',
    role: 'monitor',
    roleTitle: 'User Monitor',
    description: 'Kewenangan: Hanya Memantau Hasil & Berapa Persen (%) yang Sudah Ditindaklanjuti secara Real-Time.',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'user-usaha',
    name: 'PT Graha Surya Mandiri',
    username: 'usaha',
    password: 'usaha123',
    email: 'pengelola@grahasurya.co.id',
    role: 'pelaku_usaha',
    roleTitle: 'Pelaku Usaha',
    description: 'Pemilik/Pengelola Gedung: Kendali Kondisi Gedung, Self-Check Kelaikan, Identifikasi Izin, & Pendampingan PTSP.',
    avatarColor: 'bg-blue-600',
    companyName: 'PT Graha Surya Mandiri',
    buildingName: 'Gedung Surya Tower',
    nib: '0123456789012',
    buildingType: 'Perkantoran',
    address: 'Jl. H.R. Rasuna Said Kav. C-22, Jakarta Selatan',
    phone: '0812-9876-5432'
  }
];

// All initial datasets are empty - ready for user upload
export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_PERMITS: Permit[] = [];

export const INITIAL_LKPM_RECORDS: LKPMRecord[] = [];

export const INITIAL_WARNING_LETTERS: WarningLetter[] = [];

export const INITIAL_EMAIL_LOGS: EmailLog[] = [];

export const INITIAL_COMPLIANCE_EVENTS: ComplianceLogEvent[] = [];
