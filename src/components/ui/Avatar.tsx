import styles from './Avatar.module.css';

interface Props {
  title: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
}

const PALETTE = [
  '#7B68FF', '#5B8EFF', '#FF6B9D', '#FFB347',
  '#4ECDC4', '#A8E063', '#FF6B6B', '#C86DD7',
];

function colorFromTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function Avatar({ title, photoUrl, size = 'md', isOnline }: Props) {
  const color = colorFromTitle(title);
  return (
    <div className={[styles.wrap, styles[size]].join(' ')} aria-label={title}>
      {photoUrl ? (
        <img className={styles.img} src={photoUrl} alt={title} />
      ) : (
        <div className={styles.placeholder} style={{ background: color }}>
          {initials(title)}
        </div>
      )}
      {isOnline && <span className={styles.online} aria-label="Online" />}
    </div>
  );
}
