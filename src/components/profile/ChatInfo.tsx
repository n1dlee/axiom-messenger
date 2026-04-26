import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import type { Chat } from '../../store/types';
import styles from './ChatInfo.module.css';

interface Props {
  chat: Chat;
  onClose: () => void;
}

interface FullInfo {
  description?: string;
  inviteLink?: string;
  memberCount?: number;
}

interface Member {
  userId: number;
  name: string;
  role: 'creator' | 'admin' | 'member';
}

export function ChatInfo({ chat, onClose }: Props) {
  const tdlib = useTdlib();
  const [info, setInfo] = useState<FullInfo>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const initials = chat.title
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isGroup = chat.type === 'group' || chat.type === 'supergroup';
  const isChannel = chat.type === 'channel';

  useEffect(() => {
    // Load full info
    if (chat.type === 'supergroup' || chat.type === 'channel') {
      // supergroupId is typically chat.id with minus prefix stripped
      const sgId = chat.id < 0 ? -chat.id - 1000000000000 : chat.id;
      tdlib.getSupergroupFullInfo(sgId);
    } else if (chat.type === 'group') {
      const bgId = chat.id < 0 ? -chat.id : chat.id;
      tdlib.getBasicGroupFullInfo(bgId);
    }

    const unlisten = listen<any>('td:user_response', ({ payload }) => {
      if (payload['@type'] === 'supergroupFullInfo' || payload['@type'] === 'basicGroupFullInfo') {
        setInfo({
          description: payload.description ?? '',
          inviteLink: payload.invite_link?.invite_link,
          memberCount: payload.member_count,
        });

        // Parse members from basicGroupFullInfo
        if (payload.members) {
          const parsed: Member[] = (payload.members as any[]).map(m => ({
            userId: m.member_id?.user_id ?? 0,
            name: `User ${m.member_id?.user_id ?? '?'}`,
            role: m.status?.['@type'] === 'chatMemberStatusCreator' ? 'creator'
              : m.status?.['@type'] === 'chatMemberStatusAdministrator' ? 'admin'
              : 'member',
          }));
          setMembers(parsed);
        }
      } else if (payload['@type'] === 'chatMembers') {
        setLoadingMembers(false);
        const parsed: Member[] = (payload.members as any[]).map(m => ({
          userId: m.member_id?.user_id ?? 0,
          name: `User ${m.member_id?.user_id ?? '?'}`,
          role: m.status?.['@type'] === 'chatMemberStatusCreator' ? 'creator'
            : m.status?.['@type'] === 'chatMemberStatusAdministrator' ? 'admin'
            : 'member',
        }));
        setMembers(parsed);
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, [chat.id]);

  // Load supergroup members
  useEffect(() => {
    if (chat.type === 'supergroup' || chat.type === 'channel') {
      const sgId = chat.id < 0 ? -chat.id - 1000000000000 : chat.id;
      setLoadingMembers(true);
      tdlib.getSupergroupMembers(sgId, 0, 50);
    }
  }, [chat.id]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose}>←</button>
          <span className={styles.headerTitle}>
            {isChannel ? 'Информация о канале' : 'Информация о группе'}
          </span>
        </div>

        {/* Avatar section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {chat.photoUrl ? (
              <img src={chat.photoUrl} alt={chat.title} className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarInitials}>{initials || '?'}</span>
            )}
          </div>
          <h2 className={styles.name}>{chat.title}</h2>
          <p className={styles.subtitle}>
            {isChannel
              ? (info.memberCount ? `${info.memberCount} подписчиков` : 'Канал')
              : (info.memberCount
                  ? `${info.memberCount} участников`
                  : isGroup ? 'Группа' : '')}
          </p>
        </div>

        {/* Info fields */}
        <div className={styles.infoFields}>
          {info.description && (
            <div className={styles.infoField}>
              <span className={styles.infoIcon}>📝</span>
              <div>
                <div className={styles.infoValue}>{info.description}</div>
                <div className={styles.infoLabel}>Описание</div>
              </div>
            </div>
          )}
          {info.inviteLink && (
            <div className={styles.infoField}>
              <span className={styles.infoIcon}>🔗</span>
              <div>
                <div
                  className={[styles.infoValue, styles.link].join(' ')}
                  onClick={() => navigator.clipboard.writeText(info.inviteLink!)}
                  title="Скопировать ссылку"
                >
                  {info.inviteLink}
                </div>
                <div className={styles.infoLabel}>Пригласительная ссылка</div>
              </div>
            </div>
          )}
        </div>

        {/* Members list */}
        {(isGroup || isChannel) && (
          <div className={styles.membersSection}>
            <div className={styles.membersHeader}>
              Участники
              {info.memberCount ? ` · ${info.memberCount}` : ''}
            </div>
            {loadingMembers ? (
              <p className={styles.loading}>Загрузка…</p>
            ) : (
              <div className={styles.membersList}>
                {members.map(m => (
                  <div key={m.userId} className={styles.memberItem}>
                    <div className={styles.memberAvatar}>
                      {String(m.userId).slice(-1).toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>{m.name}</span>
                      {m.role !== 'member' && (
                        <span className={styles.memberRole}>
                          {m.role === 'creator' ? 'Создатель' : 'Администратор'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={[styles.actionBtn, styles.leaveBtn].join(' ')}
            onClick={() => { tdlib.leaveChat(chat.id); onClose(); }}
          >
            🚪 {isChannel ? 'Отписаться' : 'Покинуть группу'}
          </button>
        </div>
      </div>
    </div>
  );
}
