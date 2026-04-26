import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import { useApp } from '../../store/AppContext';
import styles from './UserProfile.module.css';

interface Props {
  userId: number;
  chatId?: number;
  onClose: () => void;
  onMessage?: () => void;
}

interface UserFull {
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  bio?: string;
  isPremium?: boolean;
  isVerified?: boolean;
  isBot?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

export function UserProfile({ userId, chatId, onClose, onMessage }: Props) {
  const tdlib = useTdlib();
  const { dispatch } = useApp();
  const [user, setUser] = useState<UserFull | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    tdlib.getUser(userId);
    tdlib.getUserFullInfo(userId);

    const unlisten = listen<any>('td:user_response', ({ payload }) => {
      if (payload['@type'] === 'user' && payload.id === userId) {
        setUser({
          firstName: payload.first_name ?? '',
          lastName: payload.last_name ?? '',
          username: payload.usernames?.editable_username ?? payload.username,
          phone: payload.phone_number,
          isPremium: payload.is_premium,
          isVerified: payload.is_verified,
          isBot: payload.type?.['@type'] === 'userTypeBot',
          isOnline: payload.status?.['@type'] === 'userStatusOnline',
          lastSeen: formatLastSeen(payload.status),
        });
      } else if (payload['@type'] === 'userFullInfo') {
        setUser(prev => prev ? { ...prev, bio: payload.bio?.text ?? '' } : prev);
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, [userId]);

  async function handleBlock() {
    if (blocked) {
      await tdlib.unblockSender(userId);
    } else {
      await tdlib.blockSender(userId);
    }
    setBlocked(!blocked);
  }

  async function handleMessage() {
    await tdlib.createPrivateChat(userId);
    onMessage?.();
    onClose();
  }

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : 'Загрузка…';

  const initials = displayName.split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose}>←</button>
        </div>

        {/* Avatar */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <span className={styles.avatarInitials}>{initials || '?'}</span>
          </div>
          <h2 className={styles.name}>
            {displayName}
            {user?.isPremium && <span className={styles.premiumBadge} title="Telegram Premium">⭐</span>}
            {user?.isVerified && <span className={styles.verifiedBadge} title="Верифицирован">✓</span>}
            {user?.isBot && <span className={styles.botBadge}>BOT</span>}
          </h2>
          {user?.isOnline ? (
            <span className={styles.online}>онлайн</span>
          ) : user?.lastSeen ? (
            <span className={styles.lastSeen}>{user.lastSeen}</span>
          ) : null}
        </div>

        {/* Info fields */}
        {user && (
          <div className={styles.infoFields}>
            {user.phone && (
              <div className={styles.infoField}>
                <span className={styles.infoIcon}>📞</span>
                <div>
                  <div className={styles.infoValue}>{user.phone}</div>
                  <div className={styles.infoLabel}>Телефон</div>
                </div>
              </div>
            )}
            {user.username && (
              <div className={styles.infoField}>
                <span className={styles.infoIcon}>@</span>
                <div>
                  <div className={styles.infoValue}>@{user.username}</div>
                  <div className={styles.infoLabel}>Имя пользователя</div>
                </div>
              </div>
            )}
            {user.bio && (
              <div className={styles.infoField}>
                <span className={styles.infoIcon}>📝</span>
                <div>
                  <div className={styles.infoValue}>{user.bio}</div>
                  <div className={styles.infoLabel}>О себе</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleMessage}>
            💬 Написать
          </button>
          <button
            className={[styles.actionBtn, blocked ? styles.unblockBtn : styles.blockBtn].join(' ').trim()}
            onClick={handleBlock}
          >
            {blocked ? '✓ Разблокировать' : '🚫 Заблокировать'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLastSeen(status: any): string {
  if (!status) return '';
  switch (status['@type']) {
    case 'userStatusOnline':    return 'онлайн';
    case 'userStatusRecently':  return 'был(а) недавно';
    case 'userStatusLastWeek':  return 'был(а) на этой неделе';
    case 'userStatusLastMonth': return 'был(а) в этом месяце';
    case 'userStatusOffline': {
      const d = new Date((status.was_online ?? 0) * 1000);
      return `был(а) ${d.toLocaleDateString('ru-RU')} в ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    default: return '';
  }
}
