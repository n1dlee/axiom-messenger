import { useEffect, useState, type MouseEvent } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useApp } from '../../store/AppContext';
import { useTdlib } from '../../hooks/useTdlib';
import { ChatListItem } from './ChatListItem';
import { FolderTabs } from './FolderTabs';
import type { ChatFolder } from './FolderTabs';
import { ChatListMenu } from './ChatListMenu';
import { GhostModeToggle } from '../ui/GhostModeToggle';
import { SettingsPanel } from '../settings/SettingsPanel';
import { GlobalSearch } from '../search/GlobalSearch';
import { NewChatModal } from '../modals/NewChatModal';
import { CreateChatModal } from '../modals/CreateChatModal';
import type { Chat } from '../../store/types';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { state, dispatch } = useApp();
  const tdlib = useTdlib();
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [chatMenu, setChatMenu] = useState<{ chat: Chat; x: number; y: number } | null>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateChat, setShowCreateChat] = useState(false);

  useEffect(() => {
    tdlib.loadAllChats();
    // Load chat folders
    tdlib.getChatFolders();
  }, []);

  // Listen for folder data
  useEffect(() => {
    const unlisten = listen<any>('td:chat_folders', ({ payload }) => {
      if (payload['@type'] === 'chatFolders') {
        setFolders(
          (payload.chat_folders ?? []).map((f: any) => ({
            id: f.id,
            title: f.title,
            iconName: f.icon?.name,
          }))
        );
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const filtered = (() => {
    let chats = state.chats;
    if (query) {
      chats = chats.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
    }
    // Folder filtering is done on the backend side in a real client,
    // here we just show all (folder API requires extra TDLib calls per folder)
    return chats;
  })();

  function openChat(id: number) {
    dispatch({ type: 'SET_ACTIVE_CHAT', chatId: id });
    tdlib.getHistory(id);
  }

  function handleChatContextMenu(e: MouseEvent, chat: Chat) {
    e.preventDefault();
    setChatMenu({ chat, x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <aside className={styles.root}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.appName}>Axiom</span>
            <div className={styles.headerActions}>
              <ConnectionDot state={state.connectionState} />
              <GhostModeToggle
                active={state.ghostMode}
                onToggle={() => tdlib.toggleGhostMode(!state.ghostMode)}
              />
              <button
                className={styles.settingsBtn}
                onClick={() => setShowNewChat(true)}
                aria-label="Новый чат"
                title="Новый личный чат"
              >
                <PencilIcon />
              </button>
              <button
                className={styles.settingsBtn}
                onClick={() => setShowCreateChat(true)}
                aria-label="Создать группу или канал"
                title="Создать группу / канал"
              >
                <NewGroupIcon />
              </button>
              <button
                className={styles.settingsBtn}
                onClick={() => setShowSettings(true)}
                aria-label="Настройки"
                title="Настройки"
              >
                <SettingsIcon />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              type="search"
              placeholder="Поиск чатов…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { if (!query) setShowGlobalSearch(true); }}
              className={styles.searchInput}
              aria-label="Поиск по чатам"
            />
          </div>
        </header>

        {/* Folder tabs */}
        {folders.length > 0 && (
          <FolderTabs
            folders={folders}
            activeId={activeFolderId}
            onSelect={setActiveFolderId}
          />
        )}

        {/* Chat list */}
        <div className={styles.list} role="list">
          {state.chatsLoading && filtered.length === 0 && (
            <div className={styles.placeholder}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          )}

          {!state.chatsLoading && filtered.length === 0 && (
            <p className={styles.empty}>
              {query ? 'Чаты не найдены' : 'Нет чатов'}
            </p>
          )}

          {filtered.map(chat => (
            <div
              key={chat.id}
              role="listitem"
              onContextMenu={e => handleChatContextMenu(e, chat)}
            >
              <ChatListItem
                chat={chat}
                isActive={state.activeChatId === chat.id}
                onClick={() => openChat(chat.id)}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Settings panel (portal-like overlay) */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onOpenChat={id => {
            dispatch({ type: 'SET_ACTIVE_CHAT', chatId: id });
            tdlib.getHistory(id);
          }}
        />
      )}

      {/* Create group/channel modal */}
      {showCreateChat && (
        <CreateChatModal onClose={() => setShowCreateChat(false)} />
      )}

      {/* Global search */}
      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
          onSelectChat={id => {
            dispatch({ type: 'SET_ACTIVE_CHAT', chatId: id });
            tdlib.getHistory(id);
          }}
        />
      )}

      {/* Chat context menu */}
      {chatMenu && (
        <ChatListMenu
          chat={chatMenu.chat}
          x={chatMenu.x}
          y={chatMenu.y}
          onClose={() => setChatMenu(null)}
          onPin={() => tdlib.toggleChatPin(chatMenu.chat.id, !chatMenu.chat.isPinned)}
          onMute={() => chatMenu.chat.isMuted
            ? tdlib.unmuteChat(chatMenu.chat.id)
            : tdlib.muteChat(chatMenu.chat.id)
          }
          onArchive={() => tdlib.archiveChat(chatMenu.chat.id)}
          onDelete={() => {
            if (confirm(`Удалить чат "${chatMenu.chat.title}"?`)) {
              tdlib.deleteChat(chatMenu.chat.id);
            }
          }}
        />
      )}
    </>
  );
}

function ConnectionDot({ state }: { state: string }) {
  const label =
    state === 'connected' ? 'Подключено' :
    state === 'connecting' ? 'Подключение…' : 'Нет сети';
  return (
    <span
      className={[styles.dot, styles[state]].join(' ')}
      title={label}
      aria-label={label}
    />
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function NewGroupIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
