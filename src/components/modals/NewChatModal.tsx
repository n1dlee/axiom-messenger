import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import { useApp } from '../../store/AppContext';
import styles from './Modal.module.css';

interface Props {
  onClose: () => void;
  onOpenChat: (chatId: number) => void;
}

interface ContactResult {
  userId: number;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
}

export function NewChatModal({ onClose, onOpenChat }: Props) {
  const tdlib = useTdlib();
  const { dispatch } = useApp();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load all contacts on mount
    tdlib.getContacts();
  }, []);

  useEffect(() => {
    const unlisten = listen<any>('td:user_response', ({ payload }) => {
      if (payload['@type'] === 'users') {
        // contacts list — IDs only, need to fetch each user
        setLoading(false);
      } else if (payload['@type'] === 'user') {
        const u = payload;
        setContacts(prev => {
          const exists = prev.find(c => c.userId === u.id);
          if (exists) return prev;
          return [...prev, {
            userId: u.id,
            firstName: u.first_name ?? '',
            lastName: u.last_name ?? '',
            username: u.usernames?.editable_username ?? u.username,
            phone: u.phone_number,
          }];
        });
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      tdlib.searchContacts(query, 50);
    }, 300);
  }, [query]);

  async function handleSelect(userId: number) {
    await tdlib.createPrivateChat(userId);
    // Listen for the chat creation response
    onClose();
  }

  function displayName(c: ContactResult) {
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || `User ${c.userId}`;
  }

  const filtered = query
    ? contacts.filter(c =>
        displayName(c).toLowerCase().includes(query.toLowerCase()) ||
        (c.username?.toLowerCase().includes(query.toLowerCase())) ||
        (c.phone?.includes(query))
      )
    : contacts;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Новый чат</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.searchWrap}>
          <input
            ref={inputRef}
            type="search"
            className={styles.search}
            placeholder="Поиск контактов или @username…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
        </div>

        <div className={styles.list}>
          {loading && <p className={styles.hint}>Поиск…</p>}
          {!loading && filtered.length === 0 && (
            <p className={styles.hint}>Контакты не найдены</p>
          )}
          {filtered.map(contact => (
            <button
              key={contact.userId}
              className={styles.item}
              onClick={() => handleSelect(contact.userId)}
            >
              <div className={styles.avatar}>
                {displayName(contact)[0]?.toUpperCase() ?? '?'}
              </div>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{displayName(contact)}</span>
                {contact.username && (
                  <span className={styles.itemSub}>@{contact.username}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
