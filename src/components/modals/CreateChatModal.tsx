import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './Modal.module.css';

interface Props {
  onClose: () => void;
}

interface Contact {
  userId: number;
  name: string;
  username?: string;
}

export function CreateChatModal({ onClose }: Props) {
  const tdlib = useTdlib();
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [mode, setMode] = useState<'group' | 'channel'>('group');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    tdlib.getContacts();
    const unlisten = listen<any>('td:user_response', ({ payload }) => {
      if (payload['@type'] === 'user') {
        const name = [payload.first_name ?? '', payload.last_name ?? '']
          .filter(Boolean).join(' ') || `User ${payload.id}`;
        setContacts(prev => {
          if (prev.find(c => c.userId === payload.id)) return prev;
          return [...prev, {
            userId: payload.id,
            name,
            username: payload.usernames?.editable_username ?? payload.username,
          }];
        });
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  function toggleSelect(id: number) {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      if (mode === 'group') {
        await tdlib.createNewGroup(title.trim(), Array.from(selected));
      } else {
        await tdlib.createNewSupergroup(title.trim(), true, description);
      }
      onClose();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {step === 'select' ? 'Создать группу/канал' : `Настроить ${mode === 'group' ? 'группу' : 'канал'}`}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {step === 'select' && (
          <>
            {/* Type picker */}
            <div className={styles.typePicker}>
              <button
                className={[styles.typeBtn, mode === 'group' ? styles.typeActive : ''].join(' ')}
                onClick={() => setMode('group')}
              >
                👥 Группа
              </button>
              <button
                className={[styles.typeBtn, mode === 'channel' ? styles.typeActive : ''].join(' ')}
                onClick={() => setMode('channel')}
              >
                📢 Канал
              </button>
            </div>

            {mode === 'group' && (
              <>
                <p className={styles.hint}>Выберите участников</p>
                <div className={styles.list}>
                  {contacts.map(c => (
                    <button
                      key={c.userId}
                      className={[styles.item, selected.has(c.userId) ? styles.itemSelected : ''].join(' ')}
                      onClick={() => toggleSelect(c.userId)}
                    >
                      <div className={styles.avatar}>
                        {c.name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{c.name}</span>
                        {c.username && <span className={styles.itemSub}>@{c.username}</span>}
                      </div>
                      {selected.has(c.userId) && <span className={styles.checkMark}>✓</span>}
                    </button>
                  ))}
                </div>
                <div className={styles.footer}>
                  <button
                    className={styles.primaryBtn}
                    onClick={() => setStep('configure')}
                    disabled={selected.size === 0}
                  >
                    Далее ({selected.size})
                  </button>
                </div>
              </>
            )}

            {mode === 'channel' && (
              <div className={styles.footer}>
                <button className={styles.primaryBtn} onClick={() => setStep('configure')}>
                  Далее
                </button>
              </div>
            )}
          </>
        )}

        {step === 'configure' && (
          <>
            <div className={styles.form}>
              <label className={styles.label}>
                Название
                <input
                  type="text"
                  className={styles.input}
                  placeholder={mode === 'group' ? 'Название группы' : 'Название канала'}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                  maxLength={128}
                />
              </label>
              {mode === 'channel' && (
                <label className={styles.label}>
                  Описание (необязательно)
                  <textarea
                    className={styles.textarea}
                    placeholder="О чём этот канал…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    maxLength={255}
                  />
                </label>
              )}
            </div>
            <div className={styles.footer}>
              <button className={styles.secondaryBtn} onClick={() => setStep('select')}>
                Назад
              </button>
              <button
                className={styles.primaryBtn}
                onClick={handleCreate}
                disabled={!title.trim() || creating}
              >
                {creating ? 'Создание…' : 'Создать'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
