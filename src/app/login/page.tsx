'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Gamepad2, Mail, Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithEmail, signUpWithEmail, authError, clearError } = useAuthStore();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        </GlassPanel>
      </motion.div>
    </div>
  );
}
