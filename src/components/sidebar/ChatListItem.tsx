import { Avatar } from '../ui/Avatar';
import type { Chat } from '../../store/types';
import styles from './ChatListItem.module.css';

interface Props {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

function formatDate(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function ChatListItem({ chat, isActive, onClick }: Props) {
  const draft = localStorage.getItem(`draft_${chat.id}`);

  return (
    <button
      className={[styles.item, isActive ? styles.active : ''].join(' ')}
      onClick={onClick}
      aria-label={`Открыть чат: ${chat.title}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <Avatar
        title={chat.title}
        photoUrl={chat.photoUrl}
        size="md"
        isOnline={chat.isOnline}
      />

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.name}>{chat.title}</span>
          <span className={styles.time}>{formatDate(chat.lastMessageDate)}</span>
        </div>
        <div className={styles.row}>
          {draft ? (
            <span className={styles.preview}>
              <span className={styles.draftLabel}>Черновик: </span>
              {draft.slice(0, 40)}
            </span>
          ) : (
            <span className={styles.preview}>{chat.lastMessage || ' '}</span>
          )}
          {chat.unreadCount > 0 && (
            <span className={[styles.badge, chat.isMuted ? styles.muted : ''].join(' ')}>
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
