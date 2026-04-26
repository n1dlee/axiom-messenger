import { useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { Message, Reaction } from '../../store/types';
import { useTdlib } from '../../hooks/useTdlib';
import { VoiceMessage } from '../media/VoiceMessage';
import styles from './MessageBubble.module.css';

interface Props {
  message: Message;
  showSender?: boolean;
  onReact?: (messageId: number, emoji: string) => void;
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

/** Triggers a TDLib file download if not already downloaded */
function useAutoDownload(fileId?: number, localPath?: string) {
  const tdlib = useTdlib();
  useEffect(() => {
    if (fileId && !localPath) {
      tdlib.downloadFile(fileId);
    }
  }, [fileId, localPath]);
}

/** Media content rendered inside a message bubble */
function MediaContent({ message }: { message: Message }) {
  const { mediaType, fileId, localPath, fileName, fileSize, duration, text } = message;
  useAutoDownload(fileId, localPath);

  const fileSrc = localPath ? convertFileSrc(localPath) : null;

  switch (mediaType) {
    case 'photo':
      return (
        <div className={styles.mediaWrap}>
          {fileSrc ? (
            <img
              src={fileSrc}
              alt={text || 'Фото'}
              className={styles.photoImg}
              loading="lazy"
            />
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span className={styles.mediaIcon}>🖼</span>
              <span className={styles.mediaLabel}>Загрузка…</span>
            </div>
          )}
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    case 'video':
      return (
        <div className={styles.mediaWrap}>
          {fileSrc ? (
            <video
              src={fileSrc}
              controls
              preload="metadata"
              className={styles.videoEl}
            />
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span className={styles.mediaIcon}>🎬</span>
              <span className={styles.mediaLabel}>
                Видео{duration ? ` · ${formatDuration(duration)}` : ''}
                {fileSize ? ` · ${formatFileSize(fileSize)}` : ''}
              </span>
            </div>
          )}
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    case 'videoNote':
      return (
        <div className={styles.videoNoteWrap}>
          {fileSrc ? (
            <video
              src={fileSrc}
              loop
              autoPlay
              muted
              playsInline
              className={styles.videoNoteEl}
            />
          ) : (
            <div className={styles.videoNotePlaceholder}>
              <span className={styles.videoNoteIcon}>⭕</span>
            </div>
          )}
          {duration && (
            <span className={styles.videoNoteDuration}>{formatDuration(duration)}</span>
          )}
        </div>
      );

    case 'voice':
      return <VoiceMessage message={message} />;

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
        <div className={styles.documentWrap}>
          <span className={styles.mediaIcon}>📎</span>
          <div className={styles.documentInfo}>
            <span className={styles.documentName}>{fileName || 'Файл'}</span>
            {fileSize && <span className={styles.documentSize}>{formatFileSize(fileSize)}</span>}
          </div>
          {fileSrc && (
            <a href={fileSrc} download={fileName} className={styles.downloadBtn} title="Скачать">
              ⬇
            </a>
          )}
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    case 'sticker':
      return (
        <div className={styles.stickerWrapInner}>
          {fileSrc ? (
            <img src={fileSrc} alt={text || '😊'} className={styles.stickerImg} />
          ) : (
            <span className={styles.stickerEmoji}>{text || '😊'}</span>
          )}
        </div>
      );

    case 'gif':
      return (
        <div className={styles.mediaWrap}>
          {fileSrc ? (
            <video
              src={fileSrc}
              loop
              autoPlay
              muted
              playsInline
              className={styles.gifEl}
            />
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span className={styles.mediaIcon}>GIF</span>
              <span className={styles.mediaLabel}>Анимация</span>
            </div>
          )}
          {text && <p className={styles.caption}>{text}</p>}
        </div>
      );

    default:
      return null;
  }
}

/** Reaction pills below a message */
function ReactionBar({ reactions, onReact, messageId }: {
  reactions: Reaction[];
  messageId: number;
  onReact?: (messageId: number, emoji: string) => void;
}) {
  if (!reactions.length) return null;
  return (
    <div className={styles.reactions}>
      {reactions.map(r => (
        <button
          key={r.emoji}
          className={[styles.reactionPill, r.isMe ? styles.reactionMine : ''].join(' ').trim()}
          onClick={() => onReact?.(messageId, r.emoji)}
          title={r.isMe ? 'Убрать реакцию' : 'Добавить реакцию'}
        >
          {r.emoji} <span className={styles.reactionCount}>{r.count}</span>
        </button>
      ))}
    </div>
  );
}

export function MessageBubble({ message, showSender, onReact }: Props) {
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

        {/* Text content (for text messages or captions not already shown by MediaContent) */}
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

      {/* Reaction pills rendered outside bubble */}
      {message.reactions && message.reactions.length > 0 && (
        <ReactionBar
          reactions={message.reactions}
          messageId={message.id}
          onReact={onReact}
        />
      )}
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
