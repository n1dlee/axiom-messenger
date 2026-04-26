import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './Settings.module.css';

export function AccountSettings() {
  const tdlib = useTdlib();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [username, setUsername]   = useState('');
  const [bio, setBio]             = useState('');
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    tdlib.getMe();
    const unlisten = listen<any>('td:user_response', ({ payload }) => {
      if (payload['@type'] === 'user') {
        setUser(payload);
        setFirstName(payload.first_name ?? '');
        setLastName(payload.last_name ?? '');
        setUsername(payload.usernames?.editable_username ?? payload.username ?? '');
      }
    });
    const unlisten2 = listen<any>('td:me', ({ payload }) => {
      setUser(payload);
      setFirstName(payload.first_name ?? '');
      setLastName(payload.last_name ?? '');
      setUsername(payload.usernames?.editable_username ?? payload.username ?? '');
    });
    return () => {
      unlisten.then(fn => fn());
      unlisten2.then(fn => fn());
    };
  }, []);

  async function handleSave() {
    await tdlib.setName(firstName, lastName);
    if (username) await tdlib.setUsername(username);
    if (bio) await tdlib.setBio(bio);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Аккаунт</h3>

      {user && (
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {firstName.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className={styles.profileName}>{firstName} {lastName}</div>
            {user.phone_number && (
              <div className={styles.profilePhone}>+{user.phone_number}</div>
            )}
          </div>
        </div>
      )}

      <div className={styles.fields}>
        <div className={styles.fieldRow}>
          <label className={styles.label}>Имя</label>
          <input
            className={styles.input}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Имя"
          />
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.label}>Фамилия</label>
          <input
            className={styles.input}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Фамилия (необязательно)"
          />
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.label}>Имя пользователя</label>
          <div className={styles.inputPrefix}>
            <span className={styles.prefix}>@</span>
            <input
              className={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.label}>О себе</label>
          <textarea
            className={styles.textarea}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Расскажите о себе…"
            rows={3}
          />
        </div>
      </div>

      <button
        className={[styles.saveBtn, saved ? styles.saveBtnSuccess : ''].join(' ').trim()}
        onClick={handleSave}
      >
        {saved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </div>
  );
}
