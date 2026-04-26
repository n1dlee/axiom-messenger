import { useState } from 'react';
import { AccountSettings } from './AccountSettings';
import { PrivacySettings } from './PrivacySettings';
import { NotificationSettings } from './NotificationSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { SessionsSettings } from './SessionsSettings';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './SettingsPanel.module.css';

type Section =
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'sessions';

interface NavItem {
  id: Section;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'account',       label: 'Аккаунт',        icon: '👤' },
  { id: 'privacy',       label: 'Приватность',     icon: '🔒' },
  { id: 'notifications', label: 'Уведомления',     icon: '🔔' },
  { id: 'appearance',    label: 'Интерфейс',       icon: '🎨' },
  { id: 'sessions',      label: 'Устройства',      icon: '📱' },
];

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [section, setSection] = useState<Section>('account');
  const tdlib = useTdlib();

  function handleLogout() {
    if (confirm('Выйти из аккаунта?')) {
      tdlib.logOut();
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Left nav */}
        <nav className={styles.nav}>
          <div className={styles.navHeader}>
            <button className={styles.backBtn} onClick={onClose} aria-label="Закрыть настройки">
              ← Назад
            </button>
            <h2 className={styles.navTitle}>Настройки</h2>
          </div>

          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={[styles.navItem, section === item.id ? styles.navItemActive : ''].join(' ').trim()}
              onClick={() => setSection(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.navIcon}>🚪</span>
            <span>Выйти</span>
          </button>
        </nav>

        {/* Content */}
        <div className={styles.content}>
          {section === 'account'       && <AccountSettings />}
          {section === 'privacy'       && <PrivacySettings />}
          {section === 'notifications' && <NotificationSettings />}
          {section === 'appearance'    && <AppearanceSettings />}
          {section === 'sessions'      && <SessionsSettings />}
        </div>
      </div>
    </div>
  );
}
