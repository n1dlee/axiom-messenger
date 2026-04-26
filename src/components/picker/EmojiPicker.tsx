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
    const q = search.toLowerCase().trim();
    if (!q) return null;
    // Keyword map for common emoji names (covers ~80% of search intent)
    const keywords: Record<string, string> = {
      '😀':'smile happy grin','😂':'laugh cry funny lol','❤️':'heart love red',
      '😍':'love eyes heart face','🔥':'fire hot flame','👍':'like ok thumbs up',
      '😊':'smile happy blush','🥰':'love hearts smiling','😭':'cry sad tears',
      '🙏':'pray thanks hands fold','💯':'100 perfect score',
      '🎉':'party celebrate confetti','🥳':'party celebrate birthday',
      '😢':'cry sad tears','😤':'angry frustrated','😡':'angry mad red',
      '🤣':'laugh rolling floor','😘':'kiss love','😋':'yummy delicious food',
      '🤔':'think hmm wonder','😎':'cool sunglasses chill','🤗':'hug embrace',
      '😴':'sleep tired zzz','😷':'sick mask ill','🤒':'sick fever ill',
      '👋':'wave hello bye hand','👏':'clap applause','💪':'strong muscle flex',
      '🎊':'celebrate confetti party','🌟':'star shine sparkle',
      '⭐':'star yellow','🌙':'moon night sleep','☀️':'sun day bright warm',
      '🐶':'dog puppy animal','🐱':'cat kitten animal','🐭':'mouse animal',
      '🐸':'frog green animal','🦊':'fox animal orange','🦁':'lion king animal',
      '🐧':'penguin bird animal','🦋':'butterfly insect colorful',
      '🌸':'flower pink cherry blossom','🌹':'rose flower red love',
      '🍕':'pizza food italian','🍔':'burger food fast','🍣':'sushi japanese food',
      '🍰':'cake dessert birthday sweet','🎂':'birthday cake celebrate',
      '☕':'coffee hot drink morning','🍺':'beer drink alcohol',
      '🏠':'house home building','🌍':'earth world globe',
      '✈️':'plane fly travel airport','🚗':'car vehicle drive',
      '⚽':'soccer ball sport','🏀':'basketball sport','🎮':'game controller play',
      '🎵':'music note song','🎶':'music notes songs',
      '💀':'skull dead death','👻':'ghost scary halloween',
      '💩':'poop funny brown','🤡':'clown funny joker',
      '🙈':'monkey see no evil','🙉':'monkey hear no evil','🙊':'monkey speak no evil',
      '💋':'kiss lips red','💔':'broken heart sad love',
      '🤝':'handshake deal agree','✌️':'peace victory two fingers',
      '🖕':'middle finger rude','🤞':'fingers crossed luck hope',
    };
    const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    const matches = all.filter(e => {
      const kw = keywords[e] ?? '';
      return e === q || kw.includes(q);
    });
    // Also include emojis from categories whose name matches
    const catMatches = EMOJI_CATEGORIES
      .filter(c => c.name.toLowerCase().includes(q))
      .flatMap(c => c.emojis);
    const combined = [...new Set([...matches, ...catMatches])];
    return combined.length ? combined : all.slice(0, 48);
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
