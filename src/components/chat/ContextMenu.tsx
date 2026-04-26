import { useEffect, useRef } from 'react';
import type { Message } from '../../store/types';
import styles from './ContextMenu.module.css';

export interface ContextMenuAction {
  label: string;
  icon: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  x: number;
  y: number;
  message: Message;
  onClose: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onForward: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPin?: () => void;
}

export function ContextMenu({
  x, y, message, onClose,
  onReply, onEdit, onForward, onDelete, onCopy, onPin,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position if menu goes off-screen
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const actions: ContextMenuAction[] = [
    { label: 'Ответить', icon: '↩', onClick: onReply },
    ...(message.isOutgoing && !message.isDeleted && message.text
      ? [{ label: 'Редактировать', icon: '✏️', onClick: onEdit! }]
      : []
    ),
    { label: 'Переслать', icon: '➡️', onClick: onForward },
    { label: 'Копировать', icon: '📋', onClick: onCopy },
    ...(onPin ? [{ label: 'Закрепить', icon: '📌', onClick: onPin }] : []),
    { label: 'Удалить', icon: '🗑', danger: true, onClick: onDelete },
  ];

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: adjustedX, top: adjustedY }}
      role="menu"
      aria-label="Действия с сообщением"
    >
      {actions.map(action => (
        <button
          key={action.label}
          className={[styles.item, action.danger ? styles.danger : ''].join(' ').trim()}
          onClick={() => { action.onClick(); onClose(); }}
          role="menuitem"
        >
          <span className={styles.icon}>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
