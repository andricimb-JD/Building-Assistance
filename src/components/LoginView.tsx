import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound, 
  Building2, 
  Activity, 
  UploadCloud,
  FileText
} from 'lucide-react';
import { UserAccount } from '../types';
import { DEFAULT_USERS } from '../data/mockData';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Authenticate user against DEFAULT_USERS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setErrorMessage('Harap masukkan Username/Email dan Kata Sandi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedUser = DEFAULT_USERS.find(
        (u) =>
          (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) &&
          u.password === cleanPassword
      );

      if (matchedUser) {
        setIsLoading(false);
        onLoginSuccess(matchedUser);
      } else {
        setIsLoading(false);
        setErrorMessage('Username atau kata sandi tidak cocok. Silakan gunakan kartu akun resmi di bawah.');
      }
    }, 400);
  };

  // One-click quick fill & instant login for convenient testing
  const handleQuickLogin = (user: UserAccount) => {
    setIdentifier(user.username);
    setPassword(user.password);
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(user);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* App Logo */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-sky-500/20 items-center justify-center mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-sky-400" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-white bg-clip-text text-transparent">
          Building Assistance <span className="text-emerald-400">Jaksel</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Sistem Pengingat Masa Berlaku Perizinan &amp; Kepatuhan LKPM Terpadu OSS-RBA
        </p>

        <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
          <Lock className="w-3 h-3" />
          <span>Login Autentikasi Pengguna &amp; Pembatasan Wewenang (RBAC)</span>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-6">
        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-slide-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username atau Alamat Email:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: koordinator, petugas, monitor atau email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Kata Sandi (Password):
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Wajib Diisi
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun Anda"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                />
                <span>Ingat Sesi Login di Perangkat Ini</span>
              </label>

              <span className="text-[11px] text-sky-400 hover:underline cursor-pointer">
                Lupa Password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem Kepatuhan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Accounts Credential Helper Card */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Daftar Akun Resmi &amp; Kredensial Pengguna:</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              Pilih Cepat
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Klik tombol <strong>"Gunakan Akun Ini"</strong> untuk langsung mengisi username &amp; password dan menguji sistem sesuai batas wewenang peran masing-masing:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {DEFAULT_USERS.map((user) => {
              const isKoordinator = user.role === 'koordinator';
              const isPetugas = user.role === 'petugas';
              const isMonitor = user.role === 'monitor';

              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isKoordinator
                      ? 'bg-sky-950/30 border-sky-500/30 hover:border-sky-500/60'
                      : isPetugas
                      ? 'bg-amber-950/30 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isKoordinator
                          ? 'bg-sky-500/20 text-sky-300'
                          : isPetugas
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {user.roleTitle}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>

                    <div className="text-[11px] font-mono space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <p className="text-slate-400">User: <strong className="text-slate-200">{user.username}</strong></p>
                      <p className="text-slate-400">Pass: <strong className="text-slate-200">{user.password}</strong></p>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                      {isKoordinator && 'Dashboard, Komparasi NIB, Surat Teguran, Notifikasi, Tracking.'}
                      {isPetugas && 'Khusus Upload Dokumen Perizinan & LKPM Saja.'}
                      {isMonitor && 'Khusus Dashboard Pemantauan Persentase Tindak Lanjut.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className={`mt-3 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      isKoordinator
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : isPetugas
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <span>Gunakan Akun Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-slate-500">
          Sistem Kepatuhan OSS-RBA &amp; BKPM • Hak Akses Dilindungi Kebijakan Keamanan Sistem
        </p>
      </div>
    </div>
  );
};
