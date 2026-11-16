'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/i18n/useTranslation';
import { toast } from '@/store/useToastStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

/** One confirmation flow for Settings and Profile. Asks for the password only if the server requires it. */
export const DeleteAccountDialog = ({ open, onClose, onDeleted }: Props) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setNeedsPassword(false);
      setPassword('');
      setFailed(false);
      setBusy(false);
    }
  }, [open]);

  const confirm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (needsPassword && !password) return;
    setBusy(true);
    setFailed(false);
    const result = await deleteAccount(needsPassword ? password : undefined);
    setBusy(false);
    if (result === 'ok') {
      toast(t('settings.deleted'), 'success');
      onDeleted?.();
      onClose();
    } else if (result === 'reauth' && !needsPassword) {
      setNeedsPassword(true);
    } else {
      setFailed(true);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('settings.deleteTitle')} tone="danger" dismissible={!busy}>
      <form onSubmit={confirm} className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-text-dim">{t('settings.deleteBody', { name: user?.displayName || '—' })}</p>

        {needsPassword && (
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">{t('settings.deletePassword')}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              autoFocus
            />
          </label>
        )}

        {failed && (
          <p role="alert" className="rounded-xl border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-xs text-neon-red-bright">
            {t('settings.deleteError')}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" variant="danger" className="w-full" loading={busy} data-action="confirm-delete">
            {t('settings.deleteYes')}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
