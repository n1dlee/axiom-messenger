import { useState, FormEvent } from 'react';
import { GlassButton } from '../ui/GlassButton';
import styles from './AuthStep.module.css';

interface Props {
  onSubmit: (code: string) => void;
  error?: string;
}

export function CodeStep({ onSubmit, error }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      await onSubmit(code.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.heading}>Код подтверждения</h2>
      <p className={styles.hint}>Код отправлен в Telegram или по SMS</p>

      <div className={styles.field}>
        <label htmlFor="code-input" className={styles.label}>Код</label>
        <input
          id="code-input"
          type="text"
          inputMode="numeric"
          placeholder="12345"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className={[styles.input, styles.codeInput].join(' ')}
          autoFocus
          autoComplete="one-time-code"
          maxLength={6}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <GlassButton type="submit" size="lg" loading={loading} className={styles.submit}>
        Подтвердить
      </GlassButton>
    </form>
  );
}
