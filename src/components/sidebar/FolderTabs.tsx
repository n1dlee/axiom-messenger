import styles from './FolderTabs.module.css';

export interface ChatFolder {
  id: number;
  title: string;
  iconName?: string;
}

interface Props {
  folders: ChatFolder[];
  activeId: number | null; // null = All chats
  onSelect: (id: number | null) => void;
}

const FOLDER_ICONS: Record<string, string> = {
  cat_all: '💬',
  cat_private: '👤',
  cat_groups: '👥',
  cat_channels: '📢',
  cat_bots: '🤖',
  cat_unread: '🔴',
  cat_custom: '📁',
};

export function FolderTabs({ folders, activeId, onSelect }: Props) {
  if (folders.length === 0) return null;

  return (
    <div className={styles.root} role="tablist" aria-label="Папки чатов">
      {/* "All" tab always first */}
      <button
        className={[styles.tab, activeId === null ? styles.active : ''].join(' ').trim()}
        role="tab"
        aria-selected={activeId === null}
        onClick={() => onSelect(null)}
      >
        <span className={styles.tabIcon}>💬</span>
        <span className={styles.tabLabel}>Все</span>
      </button>

      {folders.map(folder => (
        <button
          key={folder.id}
          className={[styles.tab, activeId === folder.id ? styles.active : ''].join(' ').trim()}
          role="tab"
          aria-selected={activeId === folder.id}
          onClick={() => onSelect(folder.id)}
          title={folder.title}
        >
          <span className={styles.tabIcon}>
            {folder.iconName ? (FOLDER_ICONS[folder.iconName] ?? '📁') : '📁'}
          </span>
          <span className={styles.tabLabel}>{folder.title}</span>
        </button>
      ))}
    </div>
  );
}
