import { useEffect } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { ChatView } from '../chat/ChatView';
import styles from './AppLayout.module.css';

export function AppLayout() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K / Cmd+K — focus search bar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>('[aria-label="Поиск по чатам"]');
        search?.focus();
        return;
      }
      // Ctrl+F / Cmd+F — in-chat search (trigger via custom event)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('axiom:toggle-search'));
        return;
      }
      // Escape — blur any focused input
      if (e.key === 'Escape') {
        (document.activeElement as HTMLElement)?.blur?.();
        return;
      }
      // Alt+ArrowUp — previous chat
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('axiom:prev-chat'));
        return;
      }
      // Alt+ArrowDown — next chat
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('axiom:next-chat'));
        return;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.root}>
      <Sidebar />
      <ChatView />
    </div>
  );
}
