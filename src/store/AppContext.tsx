import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppState, AppAction } from './types';

const initialState: AppState = {
  authStep: 'loading',
  chats: [],
  chatsLoading: false,
  activeChatId: null,
  messages: {},
  messagesLoading: false,
  ghostMode: false,
  deletedMessages: [],
  connectionState: 'connecting',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTH_STEP':
      return { ...state, authStep: action.step, authError: action.error };

    case 'SET_CHATS':
      return { ...state, chats: action.chats };

    case 'UPSERT_CHAT': {
      const exists = state.chats.findIndex(c => c.id === action.chat.id);
      const list =
        exists >= 0
          ? state.chats.map(c => (c.id === action.chat.id ? { ...c, ...action.chat } : c))
          : [...state.chats, action.chat];
      // Always re-sort by TDLib order (higher order = appears first)
      const chats = [...list].sort((a, b) => b.order - a.order);
      return { ...state, chats };
    }

    case 'UPDATE_CHAT_POSITION': {
      const chats = state.chats
        .map(c =>
          c.id === action.chatId
            ? { ...c, order: action.order, isPinned: action.isPinned }
            : c
        )
        .sort((a, b) => b.order - a.order);
      return { ...state, chats };
    }

    case 'UPSERT_LAST_MESSAGE': {
      const chats = state.chats.map(c =>
        c.id === action.chatId
          ? { ...c, lastMessage: action.lastMessage, lastMessageDate: action.lastMessageDate }
          : c
      );
      return { ...state, chats };
    }

    case 'UPDATE_UNREAD_COUNT': {
      const chats = state.chats.map(c =>
        c.id === action.chatId ? { ...c, unreadCount: action.unreadCount } : c
      );
      return { ...state, chats };
    }

    case 'SET_CHATS_LOADING':
      return { ...state, chatsLoading: action.loading };

    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChatId: action.chatId };

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: { ...state.messages, [action.chatId]: action.messages },
      };

    case 'PREPEND_MESSAGES': {
      const existing = state.messages[action.chatId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.chatId]: [...action.messages, ...existing],
        },
      };
    }

    case 'APPEND_MESSAGE': {
      const existing = state.messages[action.chatId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.chatId]: [...existing, action.message],
        },
      };
    }

    case 'UPDATE_MESSAGE': {
      const existing = state.messages[action.chatId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.chatId]: existing.map(m =>
            m.id === action.message.id ? { ...m, ...action.message } : m
          ),
        },
      };
    }

    case 'SET_MESSAGES_LOADING':
      return { ...state, messagesLoading: action.loading };

    case 'TOGGLE_GHOST_MODE':
      return { ...state, ghostMode: !state.ghostMode };

    case 'SET_GHOST_MODE':
      return { ...state, ghostMode: action.enabled };

    case 'ADD_DELETED_MESSAGES':
      return {
        ...state,
        deletedMessages: [...state.deletedMessages, ...action.messages],
      };

    case 'SET_CONNECTION':
      return { ...state, connectionState: action.state };

    default:
      return state;
  }
}

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
