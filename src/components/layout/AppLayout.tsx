import { Sidebar } from '../sidebar/Sidebar';
import { ChatView } from '../chat/ChatView';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <div className={styles.root}>
      <Sidebar />
      <ChatView />
    </div>
  );
}
