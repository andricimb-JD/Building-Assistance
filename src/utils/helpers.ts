import { Permit, PermitStatus, LKPMRecord, WarningLetter, Company, NIBComparisonEntity, ComparisonStatus } from '../types';

export const calculateDaysRemaining = (expiryDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getPermitStatus = (daysRemaining: number): PermitStatus => {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 7) return 'warning_7';
  if (daysRemaining <= 30) return 'warning_30';
  if (daysRemaining <= 90) return 'warning_90';
  return 'active';
};

export const getPermitStatusBadge = (status: PermitStatus, daysRemaining: number) => {
  switch (status) {
    case 'expired':
      return {
        label: `Kedaluwarsa (${Math.abs(daysRemaining)} hari lalu)`,
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
        badge: 'Kedaluwarsa'
      };
    case 'warning_7':
      return {
        label: `Kritis: Sisa ${daysRemaining} Hari`,
        color: 'bg-red-100 text-red-900 border-red-300 animate-pulse',
        dot: 'bg-red-600',
        badge: 'Kritis H-7'
      };
    case 'warning_30':
      return {
        label: `Mendesak: Sisa ${daysRemaining} Hari`,
        color: 'bg-amber-100 text-amber-900 border-amber-300',
        dot: 'bg-amber-500',
        badge: 'Peringatan H-30'
      };
    case 'warning_90':
      return {
        label: `Perhatian: Sisa ${daysRemaining} Hari`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        dot: 'bg-yellow-500',
        badge: 'Waspada H-90'
      };
    case 'active':
    default:
      return {
        label: `Aktif (${daysRemaining} Hari)`,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        badge: 'Aman'
      };
  }
};

export const formatIndonesianDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

export const formatCurrencyIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateComplianceScore = (permits: Permit[], lkpmRecords: LKPMRecord[]) => {
  if (permits.length === 0 && lkpmRecords.length === 0) return 100;

  let permitPoints = 0;
  permits.forEach((p) => {
    const days = calculateDaysRemaining(p.expiryDate);
    if (days < 0) {
      permitPoints += 0;
    } else if (days <= 7) {
      permitPoints += 30;
    } else if (days <= 30) {
      permitPoints += 60;
    } else if (days <= 90) {
      permitPoints += 85;
    } else {
      permitPoints += 100;
    }
  });

  const avgPermitScore = permits.length > 0 ? permitPoints / permits.length : 100;

  let lkpmPoints = 0;
  lkpmRecords.forEach((l) => {
    if (l.status === 'Disetujui') lkpmPoints += 100;
    else if (l.status === 'Terkirim') lkpmPoints += 90;
    else if (l.status === 'Perlu Perbaikan') lkpmPoints += 60;
    else if (l.status === 'Draf') lkpmPoints += 40;
    else if (l.status === 'Belum Lapor') {
      const isPast = calculateDaysRemaining(l.deadlineDate) < 0;
      lkpmPoints += isPast ? 0 : 25;
    }
  });

  const avgLkpmScore = lkpmRecords.length > 0 ? lkpmPoints / lkpmRecords.length : 100;

  // 60% Weight on Permits, 40% Weight on LKPM
  const overallScore = Math.round(avgPermitScore * 0.55 + avgLkpmScore * 0.45);
  return Math.min(100, Math.max(0, overallScore));
};

export const generateSampleCsvLKPM = (): string => {
  const headers = [
    'Nama Perusahaan',
    'NIB',
    'Kode KBLI',
    'Judul KBLI',
    'Lokasi Proyek',
    'Skala Usaha',
    'Periode LKPM',
    'Tahun',
    'Batas Waktu (YYYY-MM-DD)',
    'Nilai Investasi (IDR)',
    'Status Pelaporan',
    'Tingkat Sanksi',
    'Nama PIC',
    'Email PIC',
    'Catatan Petugas'
  ];

  const sampleRows = [
    [
      'PT Nusantara Petrokimia Raya',
      '1289000452109',
      '20111',
      'Industri Kimia Dasar Anorganik Khlor dan Alkali',
      'Kawasan Industri Cilegon Kav. B-12 Banten',
      'Besar',
      'Triwulan III',
      '2026',
      '2026-10-15',
      '24500000000',
      'Belum Lapor',
      'Peringatan Tertulis I',
      'Andri Wicaksono',
      'andri.cimb@gmail.com',
      'Melewati batas pelaporan triwulanan'
    ],
    [
      'PT Indo Prima Manufaktur Tbk',
      '9120008471923',
      '29300',
      'Industri Suku Cadang Dan Aksesori Kendaraan Bermotor Roda Empat',
      'Kawasan MM2100 Cikarang Barat Bekasi',
      'Besar',
      'Triwulan III',
      '2026',
      '2026-10-15',
      '15200000000',
      'Belum Lapor',
      'Peringatan Tertulis II',
      'Budi Santoso',
      'legal.indoprima@corp.co.id',
      'Segera submit sebelum pembekuan fasilitas'
    ],
    [
      'PT Sentosa Logistik Abadi',
      '0192837465019',
      '52101',
      'Pergudangan dan Penyimpanan',
      'Kawasan Berikat Nusantara Marunda',
      'Menengah',
      'Triwulan III',
      '2026',
      '2026-10-15',
      '6500000000',
      'Belum Lapor',
      'Peringatan Tertulis I',
      'Siti Nurhaliza',
      'siti.sentosa@gmail.com',
      'Belum ada draft masuk'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  return csvContent;
};

export const calculateFollowUpMetrics = (permits: Permit[], lkpmRecords: LKPMRecord[]) => {
  // Urgent permits needing action (expired or <= 90 days)
  const urgentPermits = permits.filter((p) => calculateDaysRemaining(p.expiryDate) <= 90);
  const followedUpPermits = urgentPermits.filter((p) => p.followUpStatus === 'Sudah Ditindaklanjuti');
  const inProgressPermits = urgentPermits.filter((p) => p.followUpStatus === 'Dalam Proses');
  const pendingPermits = urgentPermits.filter((p) => !p.followUpStatus || p.followUpStatus === 'Belum Ditindaklanjuti');

  const urgentPermitsCount = urgentPermits.length;
  const followedUpPermitsCount = followedUpPermits.length;
  const inProgressPermitsCount = inProgressPermits.length;
  const pendingPermitsCount = pendingPermits.length;

  const permitFollowedUpPct = urgentPermitsCount > 0 
    ? Math.round((followedUpPermitsCount / urgentPermitsCount) * 100) 
    : 0;
  const permitInProgressPct = urgentPermitsCount > 0 
    ? Math.round((inProgressPermitsCount / urgentPermitsCount) * 100) 
    : 0;
  const permitPendingPct = urgentPermitsCount > 0 
    ? Math.max(0, 100 - permitFollowedUpPct - permitInProgressPct) 
    : 0;

  // Urgent LKPM needing action (Belum Lapor, Perlu Perbaikan)
  const urgentLKPM = lkpmRecords.filter((l) => l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan');
  const followedUpLKPM = urgentLKPM.filter((l) => l.followUpStatus === 'Sudah Ditindaklanjuti');
  const inProgressLKPM = urgentLKPM.filter((l) => l.followUpStatus === 'Dalam Proses');
  const pendingLKPM = urgentLKPM.filter((l) => !l.followUpStatus || l.followUpStatus === 'Belum Ditindaklanjuti');

  const urgentLKPMCount = urgentLKPM.length;
  const followedUpLKPMCount = followedUpLKPM.length;
  const inProgressLKPMCount = inProgressLKPM.length;
  const pendingLKPMCount = pendingLKPM.length;

  const lkpmFollowedUpPct = urgentLKPMCount > 0
    ? Math.round((followedUpLKPMCount / urgentLKPMCount) * 100)
    : 0;
  const lkpmInProgressPct = urgentLKPMCount > 0
    ? Math.round((inProgressLKPMCount / urgentLKPMCount) * 100)
    : 0;
  const lkpmPendingPct = urgentLKPMCount > 0
    ? Math.max(0, 100 - lkpmFollowedUpPct - lkpmInProgressPct)
    : 0;

  // Total Action Items and Cumulative Percentages
  const totalActionItems = urgentPermitsCount + urgentLKPMCount;
  const totalFollowedUp = followedUpPermitsCount + followedUpLKPMCount;
  const totalInProgress = inProgressPermitsCount + inProgressLKPMCount;
  const totalPending = pendingPermitsCount + pendingLKPMCount;

  const overallFollowedUpPct = totalActionItems > 0 
    ? Math.round((totalFollowedUp / totalActionItems) * 100) 
    : 0;
  const overallInProgressPct = totalActionItems > 0 
    ? Math.round((totalInProgress / totalActionItems) * 100) 
    : 0;
  const overallPendingPct = totalActionItems > 0 
    ? Math.max(0, 100 - overallFollowedUpPct - overallInProgressPct) 
    : 0;

  return {
    urgentPermitsCount,
    followedUpPermitsCount,
    inProgressPermitsCount,
    pendingPermitsCount,
    permitFollowedUpPct,
    permitInProgressPct,
    permitPendingPct,
    permitFollowUpRate: permitFollowedUpPct,

    urgentLKPMCount,
    followedUpLKPMCount,
    inProgressLKPMCount,
    pendingLKPMCount,
    lkpmFollowedUpPct,
    lkpmInProgressPct,
    lkpmPendingPct,
    lkpmFollowUpRate: lkpmFollowedUpPct,

    totalActionItems,
    totalFollowedUp,
    totalInProgress,
    totalPending,
    overallFollowedUpPct,
    overallInProgressPct,
    overallPendingPct,
    overallFollowUpRate: overallFollowedUpPct
  };
};

export const generateSampleCsvPermits = (): string => {
  const headers = [
    'Nama Perusahaan',
    'Nama Perizinan',
    'Kategori',
    'Nomor Dokumen',
    'Instansi Penerbit',
    'Tanggal Terbit (YYYY-MM-DD)',
    'Tanggal Kedaluwarsa (YYYY-MM-DD)',
    'Nama PIC',
    'Email PIC',
    'Catatan Teknis'
  ];

  const sampleRows = [
    [
      'PT Nusantara Petrokimia Raya',
      'Izin Lingkungan Hidup (Persetujuan Lingkungan / AMDAL)',
      'Lingkungan Hidup',
      'SK.520/MENLHK/SETJEN/PLA.4/2021',
      'Kementerian Lingkungan Hidup dan Kehutanan RI',
      '2023-11-05',
      '2026-11-05',
      'Andri Wicaksono',
      'andri.cimb@gmail.com',
      'Kajian teknis addendum AMDAL dan persetujuan air limbah'
    ],
    [
      'PT Cipta Pangan Lestari',
      'Sertifikat Halal BPJPH (Bahan Baku & Lini Produksi)',
      'Kesehatan & Pangan',
      'ID00410000189420921',
      'BPJPH Kementerian Agama RI',
      '2022-11-15',
      '2026-11-15',
      'Hendra Gunawan',
      'andri.cimb@gmail.com',
      'Audit internal SJPH telah siap'
    ],
    [
      'PT Indo Prima Manufaktur Tbk',
      'Sertifikat Laik Fungsi (SLF) Gedung Pabrik & Gudang A',
      'Bangunan & Konstruksi',
      '640/SLF-DPMPTSP/BKS/2021',
      'Dinas Penanaman Modal & PTSP Kab. Bekasi',
      '2021-10-15',
      '2026-10-15',
      'Budi Santoso',
      'legal.indoprima@corp.co.id',
      'Dokumen perpanjangan SLF struktur baja'
    ],
    [
      'CV Berkah Energi Mandiri',
      'Surat Izin Laik Operasi (SLO) Genset Pembangkit Darurat 500 kVA',
      'Operasional & Teknis',
      'SLO-DJE/ESDM/2024/771',
      'Direktorat Jenderal Ketenagalistrikan ESDM',
      '2024-12-20',
      '2026-12-20',
      'Rahmat Hidayat',
      'rahmat.energi@gmail.com',
      'Jadwal inspeksi teknis dari LIT'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  return csvContent;
};

export const buildNIBComparisonList = (
  companies: Company[],
  permits: Permit[],
  lkpmRecords: LKPMRecord[]
): NIBComparisonEntity[] => {
  // Aggregate companies from companies list + any distinct entity in permits or lkpm
  const companyMap = new Map<string, Company>();

  companies.forEach((c) => {
    companyMap.set(c.nib || c.id, c);
  });

  permits.forEach((p) => {
    const key = p.nib || p.companyName;
    if (key && !companyMap.has(key)) {
      companyMap.set(key, {
        id: p.companyId || `comp-${key}`,
        name: p.companyName,
        nib: p.nib || '0000000000000',
        npwp: '-',
        address: 'Indonesia',
        city: '-',
        province: '-',
        picName: p.picName || 'Penanggung Jawab',
        picEmail: p.picEmail || 'andri.cimb@gmail.com',
        picPhone: '-',
        scale: 'Besar',
        sector: p.category || 'Umum'
      });
    }
  });

  lkpmRecords.forEach((l) => {
    const key = l.nib || l.companyName;
    if (key && !companyMap.has(key)) {
      companyMap.set(key, {
        id: l.companyId || `comp-${key}`,
        name: l.companyName,
        nib: l.nib || '0000000000000',
        npwp: '-',
        address: l.projectLocation || 'Indonesia',
        city: '-',
        province: '-',
        picName: l.picName || 'Penanggung Jawab',
        picEmail: l.picEmail || 'andri.cimb@gmail.com',
        picPhone: '-',
        scale: l.scale || 'Besar',
        sector: l.kbliTitle || 'Umum'
      });
    }
  });

  const allEffectiveCompanies = Array.from(companyMap.values());

  return allEffectiveCompanies.map((company) => {
    // Find all permits belonging to this company/NIB
    const companyPermits = permits.filter(
      (p) => p.companyId === company.id || (p.nib && p.nib === company.nib) || p.companyName.toLowerCase() === company.name.toLowerCase()
    );

    // Find all LKPM belonging to this company/NIB
    const companyLKPM = lkpmRecords.filter(
      (l) => l.companyId === company.id || (l.nib && l.nib === company.nib) || l.companyName.toLowerCase() === company.name.toLowerCase()
    );

    const expiredPermits = companyPermits.filter((p) => calculateDaysRemaining(p.expiryDate) < 0);
    const criticalPermits = companyPermits.filter((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      return days >= 0 && days <= 30;
    });
    const warningPermits = companyPermits.filter((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      return days > 30 && days <= 90;
    });
    const safePermits = companyPermits.filter((p) => calculateDaysRemaining(p.expiryDate) > 90);

    const unfiledLKPM = companyLKPM.filter((l) => l.status === 'Belum Lapor');
    const revisionLKPM = companyLKPM.filter((l) => l.status === 'Perlu Perbaikan');
    const approvedLKPM = companyLKPM.filter((l) => l.status === 'Disetujui');
    const draftLKPM = companyLKPM.filter((l) => l.status === 'Draf');

    const hasExpiredOrCriticalPermit = expiredPermits.length > 0 || criticalPermits.length > 0;
    const hasUnfiledOrRevisionLKPM = unfiledLKPM.length > 0 || revisionLKPM.length > 0;

    let comparisonStatus: ComparisonStatus = 'FULLY_COMPLIANT';
    let statusLabel = '✅ Patuh Penuh';
    let statusDescription = 'Seluruh izin aktif & LKPM telah disetujui';
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (hasExpiredOrCriticalPermit && hasUnfiledOrRevisionLKPM) {
      comparisonStatus = 'DUAL_VIOLATION';
      statusLabel = '🚨 Pelanggaran Ganda';
      statusDescription = 'Izin Habis/Kritis SEKALIGUS Belum Lapor LKPM';
      badgeColor = 'bg-rose-600 text-white border-rose-700 shadow-sm';
    } else if (hasExpiredOrCriticalPermit && !hasUnfiledOrRevisionLKPM) {
      comparisonStatus = 'PERMIT_ONLY_ISSUE';
      statusLabel = '⚠️ Izin Habis / Kritis Saja';
      statusDescription = 'Perlu perpanjangan izin, pelaporan LKPM tertib';
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (!hasExpiredOrCriticalPermit && hasUnfiledOrRevisionLKPM) {
      comparisonStatus = 'LKPM_ONLY_ISSUE';
      statusLabel = '⚠️ Belum Lapor LKPM Saja';
      statusDescription = 'Kewajiban LKPM tertunda, izin usaha aman';
      badgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-300';
    }

    return {
      nib: company.nib,
      companyId: company.id,
      companyName: company.name,
      scale: company.scale,
      sector: company.sector,
      address: company.address,
      picName: company.picName,
      picEmail: company.picEmail,
      picPhone: company.picPhone,

      totalPermits: companyPermits.length,
      expiredPermits,
      criticalPermits,
      warningPermits,
      safePermits,
      allPermits: companyPermits,
      hasExpiredOrCriticalPermit,

      totalLKPM: companyLKPM.length,
      unfiledLKPM,
      revisionLKPM,
      approvedLKPM,
      draftLKPM,
      allLKPM: companyLKPM,
      hasUnfiledOrRevisionLKPM,

      comparisonStatus,
      statusLabel,
      statusDescription,
      badgeColor
    };
  });
};

export const generateEmailNotificationTemplate = (
  type: 'PERMIT' | 'LKPM' | 'WARNING_LETTER' | 'DUAL_VIOLATION',
  recipientName: string,
  companyName: string,
  itemTitle: string,
  daysCount: number,
  extraDetails?: string,
  nibNumber?: string
) => {
  const isExpired = daysCount < 0;
  const absDays = Math.abs(daysCount);

  let badgeColor = '#e11d48';
  let statusHeadline = 'PERINGATAN RESMI KEPATUHAN PERUSAHAAN';
  let messageIntro = '';

  if (type === 'PERMIT') {
    if (isExpired) {
      statusHeadline = 'PERIZINAN KEDALUWARSA - TINDAKAN SEGERA DIPERLUKAN';
      messageIntro = `Dokumen perizinan/sertifikat usaha <strong>${itemTitle}</strong> milik <strong>${companyName}</strong> telah <strong>KEDALUWARSA sejak ${absDays} hari lalu</strong>.`;
    } else {
      statusHeadline = `PERINGATAN MASA BERLAKU (SISA ${daysCount} HARI)`;
      messageIntro = `Masa berlaku perizinan/sertifikat <strong>${itemTitle}</strong> milik <strong>${companyName}</strong> tersisa <strong>${daysCount} hari kalender</strong> lagi.`;
    }
  } else if (type === 'LKPM') {
    badgeColor = '#dc2626';
    statusHeadline = 'TEGURAN KETERLAMBATAN PELAPORAN LKPM (OSS-BKPM)';
    messageIntro = `Perusahaan <strong>${companyName}</strong> terdeteksi <strong>BELUM MENYAMPAIKAN Laporan Kegiatan Penanaman Modal (LKPM)</strong> untuk periode <strong>${itemTitle}</strong> yang telah melewati batas akhir. Segera laksanakan pelaporan pada sistem OSS-RBA.`;
  } else if (type === 'DUAL_VIOLATION') {
    badgeColor = '#991b1b';
    statusHeadline = 'PERINGATAN RESMI TERPADU: PELANGGARAN GANDA PERIZINAN & LKPM';
    messageIntro = `Berdasarkan audit komparasi terpadu berbasis NIB (<strong>${nibNumber || '-'}</strong>), perusahaan <strong>${companyName}</strong> terdeteksi memiliki <strong>PELANGGARAN GANDA</strong>: Dokumen perizinan telah <strong>kedaluwarsa/kritis</strong> SEKALIGUS <strong>belum menyampaikan kewajiban Laporan Kegiatan Penanaman Modal (LKPM)</strong> pada sistem OSS-RBA.`;
  } else {
    badgeColor = '#b91c1c';
    statusHeadline = 'PENERBITAN SURAT TEGURAN RESMI KEPATUHAN';
    messageIntro = `Telah diterbitkan Surat Teguran Resmi Kepatuhan Perizinan dan Pelaporan Investasi untuk <strong>${companyName}</strong>.`;
  }

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #38bdf8;">KEPATUHAN<span style="color:#ffffff;">PLUS</span></h2>
          <span style="background: ${badgeColor}; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
            ${type === 'DUAL_VIOLATION' ? 'SP Terpadu NIB' : 'Notifikasi Resmi'}
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Sistem Manajemen & Pengawasan Masa Berlaku Perizinan & LKPM Berbasis OSS-RBA</p>
      </div>

      <div style="padding: 28px;">
        <div style="border-left: 4px solid ${badgeColor}; padding-left: 14px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 16px; font-weight: 700;">${statusHeadline}</h3>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            NIB: <strong>${nibNumber || 'Terdaftar'}</strong> | Tanggal Audit: ${formatIndonesianDate(new Date().toISOString())}
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
          Kepada Yth.<br/>
          <strong>Bapak/Ibu ${recipientName}</strong><br/>
          Penanggung Jawab Kepatuhan & Perizinan (PIC)<br/>
          <strong>${companyName}</strong>
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          ${messageIntro}
        </p>

        ${extraDetails ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Rincian Pelanggaran Terpadu:</h4>
          <div style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.6;">${extraDetails}</div>
        </div>` : ''}

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
            <strong>Peringatan Hukum & Batas Waktu:</strong> Sesuai PP No. 5 Tahun 2021 dan Peraturan BKPM No. 5 Tahun 2021, kelalaian ganda ini wajib diselesaikan dalam tempo paling lambat <strong>5 (lima) hari kerja</strong>. Pengabaian surat teguran ini akan ditindaklanjuti dengan pembekuan izin operasional dan pemblokiran hak akses NIB pada portal OSS-RBA.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="#" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 14px; border-radius: 8px; display: inline-block;">
            Konfirmasi Penyelesaian Kepatuhan NIB
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Email ini diterbitkan melalui Sistem Terpadu Pengawasan Kepatuhan OSS-RBA & BKPM. Anda menerima peringatan resmi ini karena tercatat sebagai PIC berwenang untuk <strong>${companyName}</strong> (NIB: ${nibNumber || '-'}).
        </p>
      </div>
    </div>
  `;
};

