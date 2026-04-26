import { useState, FormEvent } from 'react';
import { GlassButton } from '../ui/GlassButton';
import styles from './AuthStep.module.css';

interface Props {
  onSubmit: (phone: string) => void;
  error?: string;
}

export function PhoneStep({ onSubmit, error }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await onSubmit(phone.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.heading}>Вход в Telegram</h2>
      <p className={styles.hint}>Введи номер телефона с кодом страны</p>

      <div className={styles.field}>
        <label htmlFor="phone-input" className={styles.label}>Номер телефона</label>
        <input
          id="phone-input"
          type="tel"
          inputMode="tel"
          placeholder="+7 900 000 00 00"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className={styles.input}
          autoFocus
          autoComplete="tel"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <GlassButton type="submit" size="lg" loading={loading} className={styles.submit}>
        Далее
      </GlassButton>
    </form>
  );
}
