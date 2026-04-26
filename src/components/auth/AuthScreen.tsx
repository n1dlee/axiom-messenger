import { useApp } from '../../store/AppContext';
import { useTdlib } from '../../hooks/useTdlib';
import { PhoneStep } from './PhoneStep';
import { CodeStep } from './CodeStep';
import { PasswordStep } from './PasswordStep';
import styles from './AuthScreen.module.css';

export function AuthScreen() {
  const { state } = useApp();
  const tdlib = useTdlib();

  return (
    <div className={styles.root}>
      {/* Decorative orbs */}
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.card} role="main">
        {/* Logo */}
        <div className={styles.logo}>
          <LogoIcon />
          <span className={styles.logoText}>Axiom</span>
        </div>

        {/* Step content */}
        <div className={styles.stepWrap}>
          {state.authStep === 'loading' && (
            <div className={styles.loading}>
              <span className={styles.spinner} />
              <p>Подключение…</p>
            </div>
          )}

          {state.authStep === 'phoneNumber' && (
            <PhoneStep onSubmit={tdlib.sendPhone} error={state.authError} />
          )}

          {state.authStep === 'code' && (
            <CodeStep onSubmit={tdlib.sendCode} error={state.authError} />
          )}

          {state.authStep === 'password' && (
            <PasswordStep onSubmit={tdlib.sendPassword} error={state.authError} />
          )}

          {state.authStep === 'error' && (
            <div className={styles.errorState}>
              <p>{state.authError ?? 'Произошла ошибка'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="url(#lg)" />
      <path d="M9 13l9-4 9 4v10l-9 5-9-5V13z" stroke="#fff" strokeWidth="1.8"
        strokeLinejoin="round" fill="none" />
      <circle cx="18" cy="18" r="3" fill="#fff" fillOpacity=".9" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B68FF"/>
          <stop offset="1" stopColor="#4F8BFF"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
