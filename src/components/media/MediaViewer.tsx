import { useEffect, useRef, useState, type WheelEvent } from 'react';
import styles from './MediaViewer.module.css';

interface Props {
  src: string;
  type: 'photo' | 'video';
  caption?: string;
  onClose: () => void;
}

export function MediaViewer({ src, type, caption, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    if (type !== 'photo') return;
    setScale(prev => Math.max(0.5, Math.min(4, prev - e.deltaY * 0.001)));
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()} onWheel={handleWheel}>
        {type === 'photo' ? (
          <img
            src={src}
            alt={caption ?? 'Фото'}
            className={styles.media}
            style={{ transform: `scale(${scale})` }}
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            className={styles.media}
          />
        )}
      </div>

      {caption && <p className={styles.caption}>{caption}</p>}

      <button className={styles.close} onClick={onClose} aria-label="Закрыть">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {type === 'photo' && (
        <div className={styles.zoomHint}>Scroll для зума · ESC для закрытия</div>
      )}
    </div>
  );
}
