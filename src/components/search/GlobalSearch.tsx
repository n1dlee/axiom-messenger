import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import { useApp } from '../../store/AppContext';
import styles from './GlobalSearch.module.css';

interface Props {
  onClose: () => void;
  onSelectChat: (chatId: number) => void;
}

interface SearchChat {
  id: number;
  title: string;
  type: string;
}

interface SearchMessage {
  chatId: number;
  messageId: number;
  text: string;
  chatTitle: string;
  date: number;
}

export function GlobalSearch({ onClose, onSelectChat }: Props) {
  const tdlib = useTdlib();
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState<SearchChat[]>([]);
  const [messages, setMessages] = useState<SearchMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const unlisten = listen<any>('td:chats_found', ({ payload }) => {
      if (payload['@type'] === 'chats' || payload['@type'] === 'foundChats') {
        const ids: number[] = payload.chat_ids ?? [];
        const found: SearchChat[] = ids.map(id => {
          const chat = state.chats.find(c => c.id === id);
          return { id, title: chat?.title ?? `Chat ${id}`, type: chat?.type ?? 'private' };
        });
        setChats(found);
        setLoading(false);
      }
    });

    const unlistenMsgs = listen<any>('td:messages_found', ({ payload }) => {
      if (payload['@type'] === 'foundMessages') {
        const msgs: SearchMessage[] = (payload.messages ?? []).map((m: any) => {
          const chat = state.chats.find(c => c.id === m.chat_id);
          return {
            chatId: m.chat_id,
            messageId: m.id,
            text: m.content?.text?.text ?? m.content?.caption?.text ?? '',
            chatTitle: chat?.title ?? `Chat ${m.chat_id}`,
            date: m.date,
          };
        });
        setMessages(msgs);
        setLoading(false);
      }
    });

    return () => {
      unlisten.then(fn => fn());
      unlistenMsgs.then(fn => fn());
    };
  }, [state.chats]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setChats([]);
      setMessages([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      tdlib.searchChats(query);
      tdlib.searchMessagesGlobal(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') onClose();
  }

  function handleSelectChat(chatId: number) {
    onSelectChat(chatId);
    onClose();
  }

  function formatDate(ts: number) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  const hasResults = chats.length > 0 || messages.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className={styles.inputWrap}>
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder="Глобальный поиск…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Поиск по чатам и сообщениям"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {/* Results */}
        <div className={styles.results}>
          {loading && <p className={styles.hint}>Поиск…</p>}

          {!loading && query && !hasResults && (
            <p className={styles.hint}>Ничего не найдено</p>
          )}

          {!query && (
            <p className={styles.hint}>Введите запрос для поиска чатов и сообщений</p>
          )}

          {/* Chat results */}
          {chats.length > 0 && (
            <section>
              <div className={styles.section}>Чаты</div>
              {chats.map(chat => (
                <button
                  key={chat.id}
                  className={styles.item}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className={styles.itemAvatar}>
                    {chat.title[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{chat.title}</span>
                    <span className={styles.itemSub}>
                      {chat.type === 'channel' ? 'Канал'
                        : chat.type === 'group' || chat.type === 'supergroup' ? 'Группа'
                        : 'Личный чат'}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )}

          {/* Message results */}
          {messages.length > 0 && (
            <section>
              <div className={styles.section}>Сообщения</div>
              {messages.map(msg => (
                <button
                  key={`${msg.chatId}-${msg.messageId}`}
                  className={styles.item}
                  onClick={() => handleSelectChat(msg.chatId)}
                >
                  <div className={styles.itemAvatar}>
                    {msg.chatTitle[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{msg.chatTitle}</span>
                    <span className={styles.itemSub}>{msg.text.slice(0, 60)}</span>
                  </div>
                  <span className={styles.itemDate}>{formatDate(msg.date)}</span>
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
