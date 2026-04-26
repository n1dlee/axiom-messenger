import { useState } from 'react';
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
  const [settings, setSettings] = useState<Record<string, NotifState>>(() =>
    Object.fromEntries(GROUPS.map(g => [
      g.scope,
      { muteFor: 0, showPreview: true, sound: true },
    ]))
  );

  function update(scope: string, key: keyof NotifState, value: boolean | number) {
    setSettings(prev => ({
      ...prev,
      [scope]: { ...prev[scope], [key]: value },
    }));
    // TODO: invoke set_scope_notification_settings
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
