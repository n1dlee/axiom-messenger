import { useEffect, useRef } from 'react';
import type { Chat } from '../../store/types';
import styles from './ChatListMenu.module.css';

interface Props {
  chat: Chat;
  x: number;
  y: number;
  onClose: () => void;
  onPin: () => void;
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ChatListMenu({ chat, x, y, onClose, onPin, onMute, onArchive, onDelete }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp position to viewport
  const menuW = 180;
  const menuH = 180;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  function item(icon: string, label: string, action: () => void, danger = false) {
    return (
      <button
        className={[styles.item, danger ? styles.danger : ''].join(' ').trim()}
        onClick={() => { action(); onClose(); }}
      >
        <span className={styles.icon}>{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left, top }}
      role="menu"
    >
      {item(chat.isPinned ? '📌' : '📌', chat.isPinned ? 'Открепить' : 'Закрепить', onPin)}
      {item(chat.isMuted ? '🔔' : '🔕', chat.isMuted ? 'Включить звук' : 'Выключить звук', onMute)}
      {item('📦', 'В архив', onArchive)}
      {item('🗑', 'Удалить чат', onDelete, true)}
    </div>
  );
}
