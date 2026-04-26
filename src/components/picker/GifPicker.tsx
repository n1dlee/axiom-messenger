import { useEffect, useState, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './GifPicker.module.css';

interface GifItem {
  fileId: number;
  thumbnailFileId?: number;
  duration: number;
  width: number;
  height: number;
  localPath?: string;
}

interface Props {
  chatId: number;
  onClose: () => void;
}

export function GifPicker({ chatId, onClose }: Props) {
  const tdlib = useTdlib();
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load saved/recent GIFs initially
    tdlib.getSavedAnimations();

    const unlisten = listen<any>('td:media_response', ({ payload }) => {
      if (payload['@type'] === 'animations') {
        const items: GifItem[] = (payload.animations ?? []).map((a: any) => ({
          fileId: a.animation?.id ?? a.id,
          thumbnailFileId: a.thumbnail?.file?.id,
          duration: a.duration ?? 0,
          width: a.width ?? 200,
          height: a.height ?? 200,
        }));
        setGifs(items);
        setLoading(false);
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length > 0) {
      searchTimer.current = setTimeout(() => {
        setLoading(true);
        tdlib.searchAnimations(q);
      }, 400);
    } else {
      setLoading(true);
      tdlib.getSavedAnimations();
    }
  }

  async function handleGifClick(fileId: number) {
    await tdlib.sendAnimation(chatId, fileId, '');
    onClose();
  }

  return (
    <div className={styles.picker}>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Поиск GIF…"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          autoFocus
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка…</div>
      ) : (
        <div className={styles.grid}>
          {gifs.map((gif, i) => (
            <button
              key={`${gif.fileId}-${i}`}
              className={styles.gifBtn}
              onClick={() => handleGifClick(gif.fileId)}
              style={{ aspectRatio: `${gif.width}/${gif.height}` }}
            >
              {/* Placeholder until thumbnail is downloaded */}
              <div className={styles.gifPlaceholder}>
                <span>GIF</span>
              </div>
            </button>
          ))}
          {gifs.length === 0 && (
            <p className={styles.empty}>
              {query ? 'GIF не найдены' : 'Нет сохранённых GIF'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
