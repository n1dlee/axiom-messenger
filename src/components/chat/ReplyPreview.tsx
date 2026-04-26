import type { Message } from '../../store/types';
import styles from './ReplyPreview.module.css';

interface Props {
  replyTo: Message | null | undefined;
  onCancel?: () => void;
}

export function ReplyPreview({ replyTo, onCancel }: Props) {
  if (!replyTo) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar} />
      <div className={styles.content}>
        <span className={styles.name}>
          {replyTo.isOutgoing ? 'Вы' : (replyTo.senderName ?? 'Пользователь')}
        </span>
        <span className={styles.text}>
          {replyTo.mediaType
            ? getMediaLabel(replyTo.mediaType)
            : (replyTo.text.slice(0, 80) || 'Сообщение')}
        </span>
      </div>
      {onCancel && (
        <button className={styles.cancel} onClick={onCancel} aria-label="Отменить ответ">
          ✕
        </button>
      )}
    </div>
  );
}

function getMediaLabel(type: string): string {
  const labels: Record<string, string> = {
    photo: '🖼 Фото', video: '🎬 Видео', videoNote: '⭕ Видеосообщение',
    voice: '🎤 Голосовое', document: '📎 Файл', sticker: '😊 Стикер', gif: 'GIF',
  };
  return labels[type] ?? type;
}
