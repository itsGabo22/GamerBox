'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AtSign, Eye, EyeOff, Gamepad2, Lock, MailCheck, ShieldAlert, X } from 'lucide-react';
import { EMAIL_RE, GAMERTAG_RE, useAuthStore } from '@/store/useAuthStore';
import { useStageStore } from '@/store/useStageStore';
import { useTranslation } from '@/i18n/useTranslation';
import { isFirebaseConfigured } from '@/lib/firebase';
import { isLegacyLocalUid, listSavedAccounts, removeAccount, type SavedAccount } from '@/lib/accountVault';
import { stageBus } from '@/lib/stageBus';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { CrystalMark } from '@/components/brand/CrystalMark';
import { Wordmark } from '@/components/brand/Wordmark';

type Mode = 'login' | 'register';
type FieldName = 'username' | 'email' | 'password';
type Errors = Partial<Record<FieldName, string>>;

interface FieldProps {
  name: FieldName;
  label: string;
  type: string;
  value: string;
  icon: React.ReactNode;
  error?: string;
  hint?: string;
  autoComplete: string;
  inputMode?: 'email' | 'text';
  placeholder?: string;
  maxLength?: number;
  trailing?: React.ReactNode;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
}

const Field = ({ name, label, type, value, icon, error, hint, autoComplete, inputMode, placeholder, maxLength, trailing, onChange, onBlur }: FieldProps) => {
  const id = `login-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-dim" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => {
            // The stage only hears "a key was pressed" — never the value or its length.
            stageBus.emit('type');
            onChange(name, e.target.value);
          }}
          onFocus={(e) => {
            stageBus.emit('focus');
            const el = e.currentTarget;
            // Once the soft keyboard has resized the viewport, keep the field in view.
            setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
          }}
          onBlur={() => {
            stageBus.emit('blur');
            onBlur(name);
          }}
          className={cn('field pl-11', trailing && 'pr-12', error && 'field-error')}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-neon-red-bright">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-text-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export function LoginScreen() {
  const { t } = useTranslation();
  const { signInWithEmail, signUpWithEmail, sendPasswordReset, authError, clearError } = useAuthStore();
  const phase = useStageStore((s) => s.phase);
  const wordmark = useStageStore((s) => s.wordmark);
  const renderer = useStageStore((s) => s.renderer);
  const variant = useStageStore((s) => s.variant);

  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<SavedAccount[]>([]);
  const [legacyHint, setLegacyHint] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotState, setForgotState] = useState<{ busy: boolean; sent: boolean; error: string | null }>({ busy: false, sent: false, error: null });

  const headerRef = useRef<HTMLDivElement>(null);
  const [centerOffset, setCenterOffset] = useState(0);

  useEffect(() => {
    setSaved(listSavedAccounts());
    clearError();
  }, [clearError]);

  // During the intro's burst the wordmark sits at screen center, then eases to its real slot.
  useLayoutEffect(() => {
    const measure = () => {
      const rect = headerRef.current?.getBoundingClientRect();
      if (rect) setCenterOffset(window.innerHeight / 2 - (rect.top + rect.height / 2));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (authError) stageBus.emit('error');
  }, [authError]);

  const centered = phase === 'burst';
  const formVisible = phase === 'settle' || phase === 'done';
  const register = mode === 'register';

  const validate = (name: FieldName, value: string): string | undefined => {
    if (name === 'email') {
      if (!value.trim()) return t('auth.validation.emailRequired');
      if (!EMAIL_RE.test(value.trim())) return t('auth.validation.emailInvalid');
    }
    if (name === 'password') {
      if (!value) return t('auth.validation.passwordRequired');
      if (register && value.length < 6) return t('auth.validation.passwordShort');
    }
    if (name === 'username' && register) {
      if (!value.trim()) return t('auth.validation.gamertagRequired');
      if (!GAMERTAG_RE.test(value.trim())) return t('auth.validation.gamertagRule');
    }
    return undefined;
  };

  const onChange = (name: FieldName, value: string) => {
    if (authError) clearError();
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const onBlur = (name: FieldName) => {
    if (form[name]) setErrors((prev) => ({ ...prev, [name]: validate(name, form[name]) }));
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setLegacyHint(false);
    clearError();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const fields: FieldName[] = register ? ['username', 'email', 'password'] : ['email', 'password'];
    const next: Errors = {};
    fields.forEach((name) => {
      const message = validate(name, form[name]);
      if (message) next[name] = message;
    });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      stageBus.emit('error');
      document.getElementById(`login-${fields.find((f) => next[f])}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      // The store applies its own network timeout, so the button can never spin forever.
      if (register) await signUpWithEmail(form.email, form.password, form.username);
      else await signInWithEmail(form.email, form.password);
    } finally {
      setBusy(false);
    }
  };

  const pickSaved = (account: SavedAccount) => {
    const legacy = isFirebaseConfigured && isLegacyLocalUid(account.uid);
    clearError();
    setErrors({});
    setMode(legacy ? 'register' : 'login');
    setLegacyHint(legacy);
    setForm({ username: legacy ? account.displayName || '' : '', email: account.email, password: '' });
    setTimeout(() => document.getElementById('login-password')?.focus(), 80);
  };

  const forgetSaved = (account: SavedAccount) => {
    removeAccount(account.email);
    setSaved(listSavedAccounts());
  };

  const openForgot = () => {
    setForgotEmail(form.email);
    setForgotState({ busy: false, sent: false, error: null });
    setForgotOpen(true);
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotState({ busy: true, sent: false, error: null });
    const error = await sendPasswordReset(forgotEmail);
    setForgotState({ busy: false, sent: !error, error });
  };

  return (
    <>
      {/* The login is always the dark terminal, whatever theme the app uses. */}
      <div data-theme="dark" className="fixed inset-0 z-[1] bg-[#050505]" aria-hidden>
        <div className="absolute left-1/2 top-[18dvh] h-[46dvh] w-[46dvh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-red/10 blur-[90px]" />
      </div>

      <div
        data-theme="dark"
        className="relative z-10 flex min-h-[100dvh] w-full flex-col px-6 text-white"
        style={{ paddingTop: 'var(--sat)', paddingBottom: 'max(var(--sab), 20px)' }}
      >
        {/* Stage window: the WebGL crystal shows through here; SVG stands in when 3D is off. */}
        <div className="flex h-[32dvh] min-h-[150px] shrink-0 items-center justify-center" aria-hidden>
          {renderer === 'svg' && formVisible && (
            <CrystalMark animation={variant === 'reduced' ? 'none' : 'idle'} className="h-[21dvh] min-h-[110px] w-auto" />
          )}
        </div>

        <div ref={headerRef} className="shrink-0">
          <motion.div
            initial={false}
            animate={{ y: centered ? centerOffset : 0, scale: centered ? 1.12 : 1, opacity: wordmark ? 1 : 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT, opacity: { duration: 0.01 } }}
          >
            <Wordmark as="h1" tagline={t('intro.tagline')} glitch={wordmark && variant !== 'reduced' && variant !== 'none'} key={wordmark ? 'on' : 'off'} />
          </motion.div>
        </div>

        <motion.div
          initial={false}
          animate={formVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className={cn('mt-6 flex flex-1 flex-col', !formVisible && 'pointer-events-none')}
          aria-hidden={!formVisible}
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <p className="eyebrow">{t('auth.portal')}</p>
            {!isFirebaseConfigured && (
              <span className="rounded border border-mint-green/40 bg-mint-green/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-mint-green">
                {t('auth.demoMode')}
              </span>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-5">
            <Segmented
              name="auth-mode"
              label={t('auth.portal')}
              value={mode}
              onChange={switchMode}
              options={[
                { id: 'login', label: t('auth.tabLogin') },
                { id: 'register', label: t('auth.tabRegister') },
              ]}
              className="mb-5"
            />

            <AnimatePresence initial={false}>
              {(authError || legacyHint) && (
                <motion.div
                  key={authError || 'legacy'}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    role={authError ? 'alert' : 'status'}
                    className={cn(
                      'mb-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed',
                      authError ? 'border-neon-red/40 bg-neon-red/10 text-neon-red-bright' : 'border-mint-green/40 bg-mint-green/10 text-mint-green'
                    )}
                  >
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <p>{authError ? t(authError) : t('auth.legacyHint')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {register && (
                  <motion.div
                    key="gamertag"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <Field
                      name="username"
                      label={t('auth.gamertag')}
                      type="text"
                      value={form.username}
                      icon={<Gamepad2 size={17} />}
                      error={errors.username}
                      hint={t('auth.gamertagHint')}
                      autoComplete="username"
                      maxLength={16}
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field
                name="email"
                label={t('auth.email')}
                type="email"
                inputMode="email"
                value={form.email}
                icon={<AtSign size={17} />}
                error={errors.email}
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
                onChange={onChange}
                onBlur={onBlur}
              />

              <Field
                name="password"
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                icon={<Lock size={17} />}
                error={errors.password}
                hint={register ? t('auth.passwordHint') : undefined}
                autoComplete={register ? 'new-password' : 'current-password'}
                onChange={onChange}
                onBlur={onBlur}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-text-dim transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Button type="submit" variant="neon" size="lg" className="mt-1 w-full" loading={busy}>
                {register ? t('auth.submitRegister') : t('auth.submitLogin')}
              </Button>
            </form>

            {!register && (
              <button
                type="button"
                onClick={openForgot}
                className="mx-auto mt-2 flex h-11 items-center px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-text-dim underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {t('auth.forgot')}
              </button>
            )}
          </div>

          {saved.length > 0 && (
            <section className="mt-6" aria-labelledby="saved-accounts">
              <h2 id="saved-accounts" className="eyebrow mb-1">
                {t('auth.savedAccounts')}
              </h2>
              <p className="mb-3 text-xs text-text-dim">{t('auth.savedHint')}</p>
              <ul className="flex flex-col gap-2">
                {saved.map((account) => {
                  const name = account.displayName || account.email;
                  const legacy = isFirebaseConfigured && isLegacyLocalUid(account.uid);
                  return (
                    <li key={account.email} className="flex items-center gap-1 rounded-2xl border border-surface-border bg-white/5 pr-1">
                      <button type="button" onClick={() => pickSaved(account)} className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-left">
                        <Avatar name={name} src={account.photoURL} className="h-10 w-10 text-sm" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-heading text-sm font-bold text-white">{name}</span>
                            {legacy && (
                              <span className="shrink-0 rounded border border-surface-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim">
                                {t('auth.legacyBadge')}
                              </span>
                            )}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-text-dim">{account.email}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => forgetSaved(account)}
                        aria-label={t('auth.forget', { name })}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-dim transition-colors hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </motion.div>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title={t('auth.forgotTitle')} dismissible={!forgotState.busy}>
        <div>
          {forgotState.sent ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center" role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-mint-green/40 bg-mint-green/10 text-mint-green">
                <MailCheck size={24} aria-hidden />
              </span>
              <p className="text-sm leading-relaxed text-white">{t('auth.forgotSent', { email: forgotEmail.trim() })}</p>
              <Button variant="ghost" className="w-full" onClick={() => setForgotOpen(false)}>
                {t('common.close')}
              </Button>
            </div>
          ) : (
            <form onSubmit={sendReset} noValidate className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-text-dim">{t('auth.forgotBody')}</p>
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">{t('auth.email')}</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={cn('field', forgotState.error && 'field-error')}
                  aria-invalid={Boolean(forgotState.error)}
                />
              </label>
              {forgotState.error && (
                <p role="alert" className="text-xs text-neon-red-bright">
                  {t(forgotState.error)}
                </p>
              )}
              <Button type="submit" variant="neon" className="w-full" loading={forgotState.busy}>
                {t('auth.forgotSend')}
              </Button>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
