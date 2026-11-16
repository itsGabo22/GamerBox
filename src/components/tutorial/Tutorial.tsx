'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation, type TFn } from '@/i18n/useTranslation';
import { useBackHandler } from '@/lib/backStack';
import { toast } from '@/store/useToastStore';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { TutorialArt } from './TutorialArt';

const SLIDES = ['s1', 's2', 's3', 's4'] as const;

interface TourStep {
  key: string;
  route: string;
  target: string;
  /** The step invites the user to actually use the highlighted control. */
  interactive?: boolean;
  /** Fixed chrome is never scrolled into view. */
  fixed?: boolean;
}

const TOUR: TourStep[] = [
  { key: 't1', route: '/', target: '[data-tour="nav"]', fixed: true, interactive: true },
  { key: 't2', route: '/discover', target: '[data-tour="add-game"]', interactive: true },
  { key: 't3', route: '/discover', target: '[data-tour="oracle"]', interactive: true },
  { key: 't4', route: '/backlog', target: '[data-tour="backlog-vault"]' },
  { key: 't5', route: '/community', target: '[data-tour="post-review"]', interactive: true },
  { key: 't6', route: '/profile', target: '[data-tour="profile-xp"]' },
  { key: 't7', route: '/profile', target: '[data-tour="settings"]', fixed: true },
];

const SkipConfirm = ({ t, onYes, onNo }: { t: TFn; onYes: () => void; onNo: () => void }) => (
  <div role="alertdialog" aria-labelledby="tut-skip-title" aria-describedby="tut-skip-body" className="flex flex-col gap-3">
    <h2 id="tut-skip-title" className="font-heading text-lg font-bold uppercase text-white">
      {t('tutorial.skipTitle')}
    </h2>
    <p id="tut-skip-body" className="text-sm leading-relaxed text-text-dim">
      {t('tutorial.skipBody')}
    </p>
    <div className="mt-1 flex gap-3">
      <Button variant="ghost" size="sm" className="flex-1" onClick={onYes} data-action="tut-skip-yes">
        {t('tutorial.skipYes')}
      </Button>
      <Button variant="neon" size="sm" className="flex-1" onClick={onNo} autoFocus>
        {t('tutorial.skipNo')}
      </Button>
    </div>
  </div>
);

/** First-run tutorial: a 4-slide welcome, then a spotlight tour over the real UI. */
export function Tutorial() {
  const { active, phase, step, setPhase, setStep, finish } = useTutorialStore();
  const uid = useAuthStore((s) => s.user?.uid);
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!active) setConfirmSkip(false);
  }, [active]);

  const total = phase === 'carousel' ? SLIDES.length : TOUR.length;

  const end = useCallback(
    (completed: boolean) => {
      finish(uid);
      if (completed) {
        toast(t('tutorial.done'), 'success');
        router.push('/');
      }
    },
    [finish, uid, t, router]
  );

  const next = useCallback(() => {
    if (step < total - 1) setStep(step + 1);
    else if (phase === 'carousel') setPhase('tour');
    else end(true);
  }, [step, total, phase, setStep, setPhase, end]);

  const back = useCallback(() => {
    if (confirmSkip) setConfirmSkip(false);
    else if (step > 0) setStep(step - 1);
    else setConfirmSkip(true);
  }, [confirmSkip, step, setStep]);

  // Hardware back = previous step; on the first step it asks before skipping.
  useBackHandler(active, back);

  if (!active || !mounted) return null;

  return createPortal(
    phase === 'carousel' ? (
      <Carousel
        t={t}
        step={step}
        confirmSkip={confirmSkip}
        onNext={next}
        onBack={() => step > 0 && setStep(step - 1)}
        onAskSkip={() => setConfirmSkip(true)}
        onSkip={() => end(false)}
        onKeep={() => setConfirmSkip(false)}
      />
    ) : (
      <Tour
        t={t}
        step={step}
        confirmSkip={confirmSkip}
        onNext={next}
        onBack={() => step > 0 && setStep(step - 1)}
        onAskSkip={() => setConfirmSkip(true)}
        onSkip={() => end(false)}
        onKeep={() => setConfirmSkip(false)}
      />
    ),
    document.body
  );
}

interface PartProps {
  t: TFn;
  step: number;
  confirmSkip: boolean;
  onNext: () => void;
  onBack: () => void;
  onAskSkip: () => void;
  onSkip: () => void;
  onKeep: () => void;
}

/** Keeps Tab inside `container` (plus an optional extra element, e.g. the spotlight target). */
const useFocusLoop = (container: React.RefObject<HTMLElement>, extra?: () => HTMLElement | null) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container.current) return;
      const inside = Array.from(container.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      const target = extra?.();
      const items = target && target.tabIndex >= 0 ? [...inside, target] : inside;
      if (items.length === 0) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const nextIndex = index === -1 ? 0 : (index + (e.shiftKey ? -1 : 1) + items.length) % items.length;
      items[nextIndex].focus();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [container, extra]);
};

// ── Part A: welcome carousel ───────────────────────────────────────────

const Carousel = ({ t, step, confirmSkip, onNext, onBack, onAskSkip, onSkip, onKeep }: PartProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [direction, setDirection] = useState(1);
  const key = SLIDES[step] || SLIDES[0];
  const last = step === SLIDES.length - 1;

  useFocusLoop(panelRef);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step, confirmSkip]);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    if (dir === 1) onNext();
    else onBack();
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('tutorial.label')}
      data-tutorial="carousel"
      className="fixed inset-0 z-[120] flex flex-col bg-obsidian-black text-white"
      style={{ paddingTop: 'calc(var(--sat) + 8px)', paddingBottom: 'max(var(--sab), 20px)' }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <div className="flex h-12 items-center justify-between">
          <span className="font-mono text-[11px] font-bold tracking-widest text-text-dim" aria-hidden>
            {t('tutorial.stepOf', { n: step + 1, total: SLIDES.length })}
          </span>
          {!confirmSkip && (
            <button
              type="button"
              onClick={onAskSkip}
              data-action="tut-skip"
              className="-mr-3 flex h-11 items-center px-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-dim transition-colors hover:text-white"
            >
              {t('common.skip')}
            </button>
          )}
        </div>

        {confirmSkip ? (
          <div className="flex flex-1 items-center">
            <div className="glass-panel w-full rounded-3xl p-6">
              <SkipConfirm t={t} onYes={onSkip} onNo={onKeep} />
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={key}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -48 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(1);
                    else if (info.offset.x > 60 && step > 0) go(-1);
                  }}
                  className="flex touch-pan-y flex-col items-center text-center"
                >
                  <div className="mb-8 flex h-[38dvh] max-h-[320px] min-h-[200px] w-full items-center justify-center">
                    <TutorialArt slide={key} t={t} />
                  </div>
                  <p className="eyebrow mb-2 text-neon-red-bright">{t(`tutorial.${key}Kicker`)}</p>
                  <h2 ref={headingRef} tabIndex={-1} className="font-heading text-[1.7rem] font-black uppercase leading-tight text-white outline-none">
                    {t(`tutorial.${key}Title`)}
                  </h2>
                  <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-text-dim">{t(`tutorial.${key}Body`)}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="sr-only" aria-live="polite">
              {t('tutorial.slideOf', { n: step + 1, total: SLIDES.length })}
            </p>

            <div className="mb-5 flex justify-center gap-2" aria-hidden>
              {SLIDES.map((s, i) => (
                <span key={s} className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-7 bg-neon-red-bright' : 'w-1.5 bg-white/25')} />
              ))}
            </div>

            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="ghost" className="w-14 px-0" onClick={() => go(-1)} aria-label={t('common.back')}>
                  <ArrowLeft size={18} aria-hidden />
                </Button>
              )}
              <Button variant="neon" className="flex-1" onClick={() => go(1)} data-action="tut-next">
                {last ? t('tutorial.start') : t('common.next')}
                <ArrowRight size={18} aria-hidden />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Part B: spotlight tour over the real UI ────────────────────────────

type Rect = { x: number; y: number; w: number; h: number };
const PAD = 8;

const Tour = ({ t, step, confirmSkip, onNext, onBack, onAskSkip, onSkip, onKeep }: PartProps) => {
  const router = useRouter();
  const pathname = (usePathname() || '/').replace(/\/+$/, '') || '/';
  const cardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const current = TOUR[step] || TOUR[0];
  const last = step === TOUR.length - 1;

  useFocusLoop(cardRef, () => targetRef.current);

  // Go to the screen this step lives on (once per step, so the user can still wander).
  useEffect(() => {
    if (pathname !== current.route) router.push(current.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Find and follow the target element.
  useEffect(() => {
    let alive = true;
    let scrolled = false;
    targetRef.current = null;
    setRect(null);

    const measure = () => {
      if (!alive) return;
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const el = document.querySelector<HTMLElement>(current.target);
      if (!el) {
        targetRef.current = null;
        setRect(null);
        return;
      }
      targetRef.current = el;
      if (!scrolled && !current.fixed) {
        scrolled = true;
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev && Math.abs(prev.x - r.left) < 0.5 && Math.abs(prev.y - r.top) < 0.5 && Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { x: r.left, y: r.top, w: r.width, h: r.height }
      );
    };

    measure();
    const interval = setInterval(measure, 200);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [current.target, current.fixed, pathname]);

  // If the user opens a real dialog from the highlighted control, step out of its way.
  useEffect(() => {
    const check = () => setDialogOpen(Boolean(document.querySelector('[role="dialog"][aria-modal="true"]:not([data-tutorial])')));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true });
    check();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dialogOpen) cardRef.current?.focus({ preventScroll: true });
  }, [step, dialogOpen, confirmSkip]);

  const hole = rect ? { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 } : null;
  const radius = hole ? Math.min(22, hole.h / 2) : 0;
  const { w: vw, h: vh } = viewport;
  // Card goes opposite to the target so it never covers what it explains.
  const cardOnTop = hole ? hole.y + hole.h / 2 > vh / 2 : false;

  const holePath = hole
    ? `M${hole.x + radius} ${hole.y}h${hole.w - radius * 2}a${radius} ${radius} 0 0 1 ${radius} ${radius}v${hole.h - radius * 2}a${radius} ${radius} 0 0 1 -${radius} ${radius}h-${hole.w - radius * 2}a${radius} ${radius} 0 0 1 -${radius} -${radius}v-${hole.h - radius * 2}a${radius} ${radius} 0 0 1 ${radius} -${radius}z`
    : '';

  return (
    <div
      data-tutorial="tour"
      className={cn('fixed inset-0 z-[120] transition-opacity duration-200', dialogOpen ? 'pointer-events-none opacity-0' : 'opacity-100')}
      style={{ pointerEvents: 'none' }}
    >
      {/* Dim layer with a click-through hole: the highlighted control stays fully usable. */}
      <svg width={vw} height={vh} className="absolute inset-0" style={{ pointerEvents: 'none' }} aria-hidden>
        <path
          d={`M0 0H${vw}V${vh}H0Z${holePath}`}
          fillRule="evenodd"
          fill="rgb(var(--c-scrim) / 0.74)"
          style={{ pointerEvents: dialogOpen ? 'none' : 'auto', transition: 'd 250ms var(--ease-out)' }}
        />
      </svg>

      {hole && (
        <div
          aria-hidden
          className="absolute animate-pulse-ring border-2 border-neon-red-bright shadow-neon-bright"
          style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: radius, pointerEvents: 'none', transition: 'all 250ms var(--ease-out)' }}
        />
      )}

      <div
        className="absolute inset-x-0 flex justify-center px-4"
        style={cardOnTop ? { top: 'calc(var(--sat) + 76px)' } : { bottom: 'calc(var(--sab) + 16px)' }}
      >
        <motion.div
          key={`${step}-${confirmSkip}`}
          ref={cardRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="tour-title"
          aria-describedby="tour-body"
          data-tutorial="card"
          tabIndex={-1}
          initial={{ opacity: 0, y: cardOnTop ? -12 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="w-full max-w-md rounded-3xl border border-surface-border bg-surface-solid p-5 shadow-glass outline-none"
          style={{ pointerEvents: dialogOpen ? 'none' : 'auto' }}
        >
          {confirmSkip ? (
            <SkipConfirm t={t} onYes={onSkip} onNo={onKeep} />
          ) : (
            <div aria-live="polite">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md border border-neon-red/40 bg-neon-red/10 px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest text-neon-red-bright">
                  {t('tutorial.stepOf', { n: step + 1, total: TOUR.length })}
                </span>
                <button
                  type="button"
                  onClick={onAskSkip}
                  className="-mr-2 flex h-11 items-center px-2 font-mono text-[11px] font-bold uppercase tracking-widest text-text-dim transition-colors hover:text-white"
                >
                  {t('common.skip')}
                </button>
              </div>
              <h2 id="tour-title" className="font-heading text-lg font-bold uppercase leading-tight text-white">
                {t(`tutorial.${current.key}Title`)}
              </h2>
              <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-text-dim">
                {t(`tutorial.${current.key}Body`)}
                {current.interactive && <span className="mt-1 block font-mono text-[11px] uppercase tracking-wider text-mint-green">{t('tutorial.tryIt')}</span>}
              </p>
              <div className="mt-4 flex gap-3">
                {step > 0 && (
                  <Button variant="ghost" size="sm" className="w-12 px-0" onClick={onBack} aria-label={t('common.back')}>
                    <ArrowLeft size={17} aria-hidden />
                  </Button>
                )}
                <Button variant="neon" size="sm" className="flex-1" onClick={onNext} data-action="tour-next">
                  {last ? t('tutorial.finish') : t('common.next')}
                  {last ? <Check size={17} aria-hidden /> : <ArrowRight size={17} aria-hidden />}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
