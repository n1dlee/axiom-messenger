import styles from './TypingIndicator.module.css';

interface Props {
  names?: string[];
}

export function TypingIndicator({ names = [] }: Props) {
  if (names.length === 0) return null;

  const label = names.length === 1
    ? `${names[0]} печатает…`
    : `${names.slice(0, 2).join(', ')} печатают…`;

  return (
    <div className={styles.wrap} aria-live="polite" aria-label={label}>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
