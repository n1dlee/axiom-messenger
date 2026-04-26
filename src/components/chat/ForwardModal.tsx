import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { useTdlib } from '../../hooks/useTdlib';
import { Avatar } from '../ui/Avatar';
import styles from './ForwardModal.module.css';

interface Props {
  messageIds: number[];
  fromChatId: number;
  onClose: () => void;
}

export function ForwardModal({ messageIds, fromChatId, onClose }: Props) {
  const { state } = useApp();
  const tdlib = useTdlib();
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState(false);

  const filtered = state.chats.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  async function handleForward(toChatId: number) {
    await tdlib.forwardMessages(fromChatId, toChatId, messageIds);
    setSent(true);
    setTimeout(onClose, 800);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Переслать в…</h3>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <input
          className={styles.search}
          placeholder="Поиск чатов…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />

        {sent ? (
          <div className={styles.sent}>✓ Сообщение переслано</div>
        ) : (
          <div className={styles.list}>
            {filtered.map(chat => (
              <button
                key={chat.id}
                className={styles.chatItem}
                onClick={() => handleForward(chat.id)}
              >
                <Avatar title={chat.title} size="sm" />
                <span className={styles.chatName}>{chat.title}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className={styles.empty}>Чаты не найдены</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
