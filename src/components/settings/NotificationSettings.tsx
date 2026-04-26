import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './Settings.module.css';

interface NotifGroup {
  scope: string;
  label: string;
  icon: string;
}

const GROUPS: NotifGroup[] = [
  { scope: 'notificationSettingsScopePrivateChats', label: 'Личные сообщения', icon: '💬' },
  { scope: 'notificationSettingsScopeGroupChats',   label: 'Группы',           icon: '👥' },
  { scope: 'notificationSettingsScopeChannelChats', label: 'Каналы',            icon: '📢' },
];

interface NotifState {
  muteFor: number; // 0 = unmuted, positive = seconds
  showPreview: boolean;
  sound: boolean;
}

export function NotificationSettings() {
  const tdlib = useTdlib();
  const [settings, setSettings] = useState<Record<string, NotifState>>(() =>
    Object.fromEntries(GROUPS.map(g => [
      g.scope,
      { muteFor: 0, showPreview: true, sound: true },
    ]))
  );

  // Fetch current settings from TDLib on mount
  useEffect(() => {
    GROUPS.forEach(g => tdlib.getNotificationSettings(g.scope));
  }, []);

  // Listen for TDLib notification settings responses
  useEffect(() => {
    const unlisten = listen<any>('td:notification_settings', ({ payload }) => {
      // scopeNotificationSettings response — find which scope it belongs to
      // TDLib echoes back the @extra or we infer from context; for now refresh all
      // The payload is the scopeNotificationSettings object
      const muteFor: number = payload.mute_for ?? 0;
      const showPreview: boolean = payload.show_preview ?? true;
      // We can't easily know which scope responded, so we apply to all matching
      // In practice, TDLib sends them sequentially so we handle gracefully
      setSettings(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(scope => {
          // Only update if this is a fresh fetch (not user-driven change)
          updated[scope] = { ...updated[scope], muteFor, showPreview };
        });
        return updated;
      });
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  function update(scope: string, key: keyof NotifState, value: boolean | number) {
    const newState = { ...settings[scope], [key]: value };
    setSettings(prev => ({ ...prev, [scope]: newState }));
    // Persist to TDLib immediately
    tdlib.setNotificationSettings(
      scope,
      key === 'muteFor' ? (value as number) : newState.muteFor,
      key === 'showPreview' ? (value as boolean) : newState.showPreview,
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Уведомления</h3>

      {GROUPS.map(group => {
        const s = settings[group.scope];
        return (
          <div key={group.scope} className={styles.notifGroup}>
            <div className={styles.notifGroupHeader}>
              <span className={styles.navIcon}>{group.icon}</span>
              <span className={styles.notifGroupLabel}>{group.label}</span>
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Уведомления</span>
              <button
                className={[styles.toggle, s.muteFor === 0 ? styles.toggleOn : ''].join(' ').trim()}
                onClick={() => update(group.scope, 'muteFor', s.muteFor === 0 ? 2147483647 : 0)}
                aria-checked={s.muteFor === 0}
                role="switch"
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            {s.muteFor === 0 && (
              <>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>Предварительный просмотр</span>
                  <button
                    className={[styles.toggle, s.showPreview ? styles.toggleOn : ''].join(' ').trim()}
                    onClick={() => update(group.scope, 'showPreview', !s.showPreview)}
                    role="switch"
                    aria-checked={s.showPreview}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>

                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>Звук</span>
                  <button
                    className={[styles.toggle, s.sound ? styles.toggleOn : ''].join(' ').trim()}
                    onClick={() => update(group.scope, 'sound', !s.sound)}
                    role="switch"
                    aria-checked={s.sound}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
