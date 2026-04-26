import { useState, FormEvent } from 'react';
import { GlassButton } from '../ui/GlassButton';
import styles from './AuthStep.module.css';

interface Props {
  onSubmit: (password: string) => void;
  error?: string;
}

export function PasswordStep({ onSubmit, error }: Props) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await onSubmit(password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.heading}>Двухфакторная защита</h2>
      <p className={styles.hint}>Введи пароль облачной аутентификации</p>

      <div className={styles.field}>
        <label htmlFor="pwd-input" className={styles.label}>Пароль</label>
        <div className={styles.passwordWrap}>
          <input
            id="pwd-input"
            type={show ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            autoFocus
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.showToggle}
            onClick={() => setShow(v => !v)}
            aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <GlassButton type="submit" size="lg" loading={loading} className={styles.submit}>
        Войти
      </GlassButton>
    </form>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
