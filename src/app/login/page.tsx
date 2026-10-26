'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Gamepad2, Mail, Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogleAccount, authError, clearError } = useAuthStore();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleSheet, setShowGoogleSheet] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
      if (vaultStr) {
        const vault = JSON.parse(vaultStr);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSavedAccounts(Object.values(vault).filter((acc: any) => acc.email?.endsWith('@gmail.com')));
      }
    }
  }, []);

  const handleSavedAccountSignIn = async (email: string, name: string) => {
    setIsLoading(true);
    try {
      const success = await signInWithGoogleAccount(email, name);
      if (success) {
        setShowGoogleSheet(false);
        router.replace('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;
      if (isRegister) {
        if (formData.username.trim() === '') {
          useAuthStore.setState({ authError: 'El Gamertag es requerido.' });
          return;
        }
        success = await signUpWithEmail(formData.email, formData.password, formData.username);
      } else {
        success = await signInWithEmail(formData.email, formData.password);
      }

      if (success) {
        router.replace('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) return;
    setIsLoading(true);
    try {
      const success = await signInWithGoogleAccount(googleEmail, googleName);
      if (success) {
        setShowGoogleSheet(false);
        router.replace('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 bg-obsidian-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-surface-glass rounded-2xl border border-surface-border flex items-center justify-center mb-4 shadow-neon">
            <Gamepad2 size={32} className="text-neon-red-bright" />
          </div>
          <h1 className="font-heading font-black text-3xl text-white tracking-wide uppercase">
            GamerBox
          </h1>
          <p className="font-mono text-[10px] text-text-dim tracking-widest uppercase mt-1">
            Terminal Access Portal
          </p>
        </div>

        <GlassPanel className="p-6">
          {/* Tabs */}
          <div className="flex w-full bg-obsidian-dark rounded-xl p-1 mb-6 border border-white/5 relative overflow-hidden">
            <div className="flex w-full relative z-10">
              <button
                onClick={() => { setIsRegister(false); clearError(); }}
                className={`flex-1 py-2 font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition-colors ${!isRegister ? 'text-white' : 'text-text-dim hover:text-white'}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setIsRegister(true); clearError(); }}
                className={`flex-1 py-2 font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition-colors ${isRegister ? 'text-white' : 'text-text-dim hover:text-white'}`}
              >
                Crear Cuenta
              </button>
            </div>
            {/* Animated Tab Indicator */}
            <motion.div
              layout
              initial={false}
              animate={{ x: isRegister ? '100%' : '0%' }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-surface-border rounded-lg border border-white/10 shadow-glass"
            />
          </div>

          <AnimatePresence mode="wait">
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3 bg-neon-red/10 border border-neon-red/30 rounded-xl text-neon-red-bright">
                  <ShieldAlert size={16} />
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider leading-tight">
                    {authError}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-dim">
                    <Gamepad2 size={16} />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="GAMERTAG"
                    className="w-full h-12 pl-10 pr-4 bg-obsidian-black border border-surface-border rounded-xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all font-mono text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-dim">
                <Mail size={16} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="EMAIL"
                required
                className="w-full h-12 pl-10 pr-4 bg-obsidian-black border border-surface-border rounded-xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all font-mono text-sm"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-dim">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="PASSWORD"
                required
                className="w-full h-12 pl-10 pr-12 bg-obsidian-black border border-surface-border rounded-xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-text-dim hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="neon"
              className="w-full h-12 mt-2 font-heading font-bold tracking-widest uppercase shadow-neon"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                isRegister ? 'INICIALIZAR IDENTIDAD' : 'CONECTAR TERMINAL'
              )}
            </Button>
          </form>

          {/* Google Sign In Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-widest">O</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-12 border border-surface-border flex items-center justify-center gap-3 bg-obsidian-black hover:bg-white/5"
            onClick={() => setShowGoogleSheet(true)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">Continuar con Google</span>
          </Button>

        </GlassPanel>
      </motion.div>

      {/* Google One-Tap Bottom Sheet */}
      <AnimatePresence>
        {showGoogleSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm" onClick={() => setShowGoogleSheet(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-obsidian-dark border-t border-surface-border rounded-t-3xl p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <h3 className="font-heading font-bold text-lg text-white mb-2 text-center">Elige una cuenta para continuar</h3>
              <p className="font-body text-xs text-text-dim text-center mb-6">para continuar en GamerBox</p>

              <div className="flex flex-col gap-3 mb-4 max-h-[30vh] overflow-y-auto">
                {savedAccounts.map(acc => (
                   <button
                     key={acc.email}
                     onClick={() => handleSavedAccountSignIn(acc.email, acc.displayName)}
                     className="w-full flex items-center gap-3 p-3 rounded-xl bg-obsidian-black border border-surface-border hover:bg-white/5 transition-colors"
                   >
                     <div className="w-10 h-10 rounded-full bg-neon-red/20 flex items-center justify-center font-heading font-bold text-neon-red-bright uppercase">
                       {acc.displayName?.substring(0, 2) || 'G'}
                     </div>
                     <div className="flex flex-col text-left">
                       <span className="font-heading font-bold text-sm text-white">{acc.displayName}</span>
                       <span className="font-mono text-[10px] text-text-dim">{acc.email}</span>
                     </div>
                   </button>
                ))}
              </div>

              <form onSubmit={handleGoogleSignIn} className="flex flex-col gap-4">
                <input required type="text" placeholder="Nombre completo" value={googleName} onChange={e => setGoogleName(e.target.value)} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                <input required type="email" placeholder="Correo electrónico (@gmail.com)" value={googleEmail} onChange={e => setGoogleEmail(e.target.value)} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                <Button type="submit" variant="neon" className="w-full h-12 mt-2" disabled={isLoading}>
                  {isLoading ? 'Conectando...' : '➕ Usar otra cuenta de Google'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
