import { useState, useMemo } from 'react';
import styles from './EmojiPicker.module.css';

// Common emoji organized by category
const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: 'Недавние', icon: '🕐',
    emojis: ['😂', '❤️', '😍', '🔥', '👍', '😊', '🥰', '😭', '🙏', '💯'],
  },
  {
    name: 'Смайлики', icon: '😊',
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
      '🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜',
      '😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑',
      '😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤',
      '😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴','😵',
      '😲','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁',
      '😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥',
      '😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱',
      '😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡',
    ],
  },
  {
    name: 'Жесты', icon: '👍',
    emojis: [
      '👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘',
      '👌','🤌','🤏','👈','👉','👆','👇','☝️','👋','🤚',
      '🖐️','✋','🖖','👏','🙌','🤲','🤝','🙏','💪','🦾',
    ],
  },
  {
    name: 'Сердца', icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❤️‍🔥','❤️‍🩹','💗','💓','💞','💕','💟','❣️','💌','💘',
    ],
  },
  {
    name: 'Животные', icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
      '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
      '🐦','🦆','🦅','🦉','🦇','🐝','🐛','🦋','🐌','🐞',
    ],
  },
  {
    name: 'Еда', icon: '🍕',
    emojis: [
      '🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🧇',
      '🥞','🧈','🍞','🥐','🥖','🥨','🧀','🥗','🥙','🌮',
      '🌯','🥪','🍝','🍜','🍲','🍛','🍣','🍱','🍤','🍙',
      '🍰','🎂','🧁','🍩','🍪','☕','🍵','🧃','🥤','🧋',
    ],
  },
  {
    name: 'Активность', icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱',
      '🪃','🏓','🏸','🏒','🥊','🥋','🎯','⛳','🎮','🕹️',
    ],
  },
  {
    name: 'Символы', icon: '🔥',
    emojis: [
      '🔥','💥','✨','🌟','⭐','🌙','☀️','⚡','❄️','🌈',
      '💫','🎉','🎊','🎈','🎁','🏆','🥇','🎖️','🎗️','🎀',
      '💎','💰','🔑','🗝️','🔒','🔓','❗','❓','💯','🆕',
    ],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  const searchResults = useMemo(() => {
    if (!search) return null;
    const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    // Simple: return all emoji (can't filter by name without a dictionary)
    return all.slice(0, 48);
  }, [search]);

  const displayEmojis = searchResults ?? EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div className={styles.picker}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Поиск emoji…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className={styles.tabs}>
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              className={[styles.tab, i === activeCategory ? styles.tabActive : ''].join(' ').trim()}
              onClick={() => setActiveCategory(i)}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className={styles.grid}>
        {displayEmojis.map(emoji => (
          <button
            key={emoji}
            className={styles.emojiBtn}
            onClick={() => { onSelect(emoji); onClose(); }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
