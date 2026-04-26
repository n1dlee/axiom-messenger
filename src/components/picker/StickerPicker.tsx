import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './StickerPicker.module.css';

interface StickerSet {
  id: number;
  title: string;
  thumbnail?: string;
  stickers: Sticker[];
}

interface Sticker {
  fileId: number;
  emoji: string;
  width: number;
  height: number;
  localPath?: string;
}

interface Props {
  chatId: number;
  onClose: () => void;
}

export function StickerPicker({ chatId, onClose }: Props) {
  const tdlib = useTdlib();
  const [sets, setSets] = useState<StickerSet[]>([]);
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    tdlib.getInstalledStickerSets();
    tdlib.getRecentStickers();

    const unlisten = listen<any>('td:media_response', ({ payload }) => {
      if (payload['@type'] === 'stickerSets') {
        // Load each set's stickers
        (payload.sets ?? []).forEach((s: any) => {
          tdlib.getStickerSet(s.id);
        });
        setLoading(false);
      } else if (payload['@type'] === 'stickerSet') {
        const set: StickerSet = {
          id: payload.id,
          title: payload.title,
          stickers: (payload.stickers ?? []).map((s: any) => ({
            fileId: s.sticker?.id ?? s.id,
            emoji: s.emoji ?? '😊',
            width: s.width ?? 512,
            height: s.height ?? 512,
          })),
        };
        setSets(prev => {
          const exists = prev.find(s => s.id === set.id);
          if (exists) return prev.map(s => s.id === set.id ? set : s);
          return [...prev, set];
        });
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);

  const activeSet = sets[activeSetIdx];
  const displayStickers = query
    ? sets.flatMap(s => s.stickers.filter(st => st.emoji.includes(query)))
    : activeSet?.stickers ?? [];

  async function handleStickerClick(fileId: number) {
    await tdlib.sendSticker(chatId, fileId);
    onClose();
  }

  return (
    <div className={styles.picker}>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Поиск стикеров…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Set tabs */}
      {!query && sets.length > 0 && (
        <div className={styles.tabs}>
          {sets.map((set, i) => (
            <button
              key={set.id}
              className={[styles.tab, i === activeSetIdx ? styles.tabActive : ''].join(' ').trim()}
              onClick={() => setActiveSetIdx(i)}
              title={set.title}
            >
              {set.stickers[0]?.emoji ?? '📦'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Загрузка стикеров…</div>
      ) : (
        <div className={styles.grid}>
          {displayStickers.map((sticker, i) => (
            <button
              key={`${sticker.fileId}-${i}`}
              className={styles.stickerBtn}
              onClick={() => handleStickerClick(sticker.fileId)}
              title={sticker.emoji}
            >
              {/* Show emoji as fallback until file is downloaded */}
              <span style={{ fontSize: 32 }}>{sticker.emoji}</span>
            </button>
          ))}
          {displayStickers.length === 0 && !loading && (
            <p className={styles.empty}>Стикеры не найдены</p>
          )}
        </div>
      )}
    </div>
  );
}
