import type { Message } from '../../store/types';
import styles from './MessageBubble.module.css';

interface Props {
  message: Message;
  showSender?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec?: number): string {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Media content rendered inside the bubble (placeholder until Фаза 3 downloads) */
function MediaContent({ message }: { message: Message }) {
  const { mediaType, fileName, fileSize, duration, text } = message;

  switch (mediaType) {
    case 'photo':
      return (
        <div className={styles.mediaPlaceholder}>
          <span className={styles.mediaIcon}>🖼</span>
          <span className={styles.mediaLabel}>Фото</span>
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    case 'video':
      return (
        <div className={styles.mediaPlaceholder}>
          <span className={styles.mediaIcon}>🎬</span>
          <span className={styles.mediaLabel}>
            Видео{duration ? ` · ${formatDuration(duration)}` : ''}
            {fileSize ? ` · ${formatFileSize(fileSize)}` : ''}
          </span>
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    case 'videoNote':
      return (
        <div className={styles.videoNotePlaceholder}>
          <span className={styles.videoNoteIcon}>⭕</span>
          <span className={styles.mediaLabel}>
            Видеосообщение{duration ? ` · ${formatDuration(duration)}` : ''}
          </span>
        </div>
      );

    case 'voice':
      return (
        <div className={styles.voicePlaceholder}>
          <span className={styles.mediaIcon}>🎤</span>
          <div className={styles.voiceWave}>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={styles.voiceBar}
                style={{ height: `${8 + Math.sin(i * 0.8) * 8}px` }}
              />
            ))}
          </div>
          <span className={styles.voiceDuration}>{formatDuration(duration)}</span>
        </div>
      );

    case 'audio':
      return (
        <div className={styles.mediaPlaceholder}>
          <span className={styles.mediaIcon}>🎵</span>
          <span className={styles.mediaLabel}>
            {fileName || 'Аудио'}
            {duration ? ` · ${formatDuration(duration)}` : ''}
          </span>
        </div>
      );

    case 'document':
      return (
        <div className={styles.documentPlaceholder}>
          <span className={styles.mediaIcon}>📎</span>
          <div className={styles.documentInfo}>
            <span className={styles.documentName}>{fileName || 'Файл'}</span>
            {fileSize && <span className={styles.documentSize}>{formatFileSize(fileSize)}</span>}
          </div>
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    case 'sticker':
      return (
        <div className={styles.stickerPlaceholder}>
          <span className={styles.stickerEmoji}>{text || '😊'}</span>
        </div>
      );

    case 'gif':
      return (
        <div className={styles.mediaPlaceholder}>
          <span className={styles.mediaIcon}>GIF</span>
          <span className={styles.mediaLabel}>Анимация</span>
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    default:
      return null;
  }
}

export function MessageBubble({ message, showSender }: Props) {
  const isOut = message.isOutgoing;
  const isDeleted = message.isDeleted;
  const hasMedia = Boolean(message.mediaType);
  const isSticker = message.mediaType === 'sticker';

  return (
    <div
      className={[
        styles.wrap,
        isOut ? styles.out : styles.in,
        isDeleted ? styles.deleted : '',
        isSticker ? styles.stickerWrap : '',
      ].join(' ').trim()}
    >
      <div className={[styles.bubble, isSticker ? styles.stickerBubble : ''].join(' ').trim()}>
        {/* Sender name (in group chats) */}
        {showSender && !isOut && message.senderName && (
          <span className={styles.sender}>{message.senderName}</span>
        )}

        {/* Deleted ghost indicator */}
        {isDeleted && (
          <div className={styles.ghostBadge}>
            <GhostIcon />
            <span>Сообщение удалено отправителем</span>
          </div>
        )}

        {/* Media content */}
        {hasMedia && !isDeleted && <MediaContent message={message} />}

        {/* Text content (for text messages or captions on non-sticker media) */}
        {!hasMedia && (
          <p className={[styles.text, isDeleted ? styles.textDeleted : ''].join(' ').trim()}>
            {message.text || (isDeleted ? '[медиа]' : '')}
          </p>
        )}

        {/* Edit badge */}
        {message.editDate && !isDeleted && (
          <span className={styles.editedBadge}>изм.</span>
        )}

        {/* Time + status — hidden for stickers */}
        {!isSticker && (
          <div className={styles.meta}>
            <span className={styles.time}>{formatTime(message.date)}</span>
            {isOut && <CheckIcon read={false} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* Date separator between groups of messages */
export function DateSeparator({ date }: { date: number }) {
  const label = new Date(date * 1000).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <div className={styles.dateSep} aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

/* ── SVG icons ──────────────────────────────────────────────────────────── */

function GhostIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
    </svg>
  );
}

function CheckIcon({ read }: { read: boolean }) {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"
      stroke={read ? 'var(--accent-400)' : 'var(--text-muted)'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {read ? (
        <>
          <polyline points="1 5 5 9 13 1"/>
          <polyline points="4 5 8 9"/>
        </>
      ) : (
        <polyline points="1 5 5 9 13 1"/>
      )}
    </svg>
  );
}
