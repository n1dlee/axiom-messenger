import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './InChatSearch.module.css';

interface Props {
  chatId: number;
  onClose: () => void;
  onJumpTo: (messageId: number) => void;
}

interface FoundMessage {
  id: number;
  text: string;
  date: number;
}

export function InChatSearch({ chatId, onClose, onJumpTo }: Props) {
  const tdlib = useTdlib();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundMessage[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const unlisten = listen<any>('td:messages_found', ({ payload }) => {
      if (payload['@type'] === 'foundChatMessages') {
        const msgs: FoundMessage[] = (payload.messages ?? []).map((m: any) => ({
          id: m.id,
          text: m.content?.text?.text ?? m.content?.caption?.text ?? `[${m.content?.['@type'] ?? 'media'}]`,
          date: m.date,
        }));
        setResults(msgs);
        setLoading(false);
        if (msgs.length > 0) {
          setCurrent(0);
          onJumpTo(msgs[0].id);
        }
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [onJumpTo]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      tdlib.searchChatMessages(chatId, query, 0, 50);
    }, 400);
  }, [query, chatId]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter') {
      if (results.length === 0) return;
      if (e.shiftKey) {
        const prev = (current - 1 + results.length) % results.length;
        setCurrent(prev);
        onJumpTo(results[prev].id);
      } else {
        const next = (current + 1) % results.length;
        setCurrent(next);
        onJumpTo(results[next].id);
      }
    }
  }

  function navigate(dir: 'prev' | 'next') {
    if (results.length === 0) return;
    const next = dir === 'next'
      ? (current + 1) % results.length
      : (current - 1 + results.length) % results.length;
    setCurrent(next);
    onJumpTo(results[next].id);
  }

  return (
    <div className={styles.root}>
      <div className={styles.inputWrap}>
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder="Поиск в чате…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          aria-label="Поиск сообщений"
        />
        {results.length > 0 && (
          <span className={styles.counter}>{current + 1}/{results.length}</span>
        )}
        {loading && <span className={styles.spinner}>⟳</span>}
      </div>

      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          disabled={results.length === 0}
          onClick={() => navigate('prev')}
          aria-label="Предыдущий результат"
          title="↑ Предыдущий"
        >
          ↑
        </button>
        <button
          className={styles.navBtn}
          disabled={results.length === 0}
          onClick={() => navigate('next')}
          aria-label="Следующий результат"
          title="↓ Следующий"
        >
          ↓
        </button>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть поиск">
          ✕
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
