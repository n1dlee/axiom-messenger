import { useState, useEffect } from 'react';
import styles from './Settings.module.css';

type Theme = 'dark' | 'light' | 'oled';

const THEMES: { id: Theme; label: string; preview: string }[] = [
  { id: 'dark',  label: 'Тёмная',  preview: '#1a1a2e' },
  { id: 'oled',  label: 'OLED',    preview: '#07070f' },
  { id: 'light', label: 'Светлая', preview: '#f0f2f5' },
];

const FONT_SIZES = [
  { value: 13, label: 'Маленький' },
  { value: 15, label: 'Средний'   },
  { value: 17, label: 'Большой'   },
  { value: 19, label: 'Очень большой' },
];

const CHAT_BACKGROUNDS = [
  { id: 'default',   label: 'По умолчанию', color: '' },
  { id: 'navy',      label: 'Тёмно-синий',  color: '#0d1b2a' },
  { id: 'forest',    label: 'Лесной',       color: '#0d1f0d' },
  { id: 'midnight',  label: 'Полночь',      color: '#1a0a2e' },
  { id: 'rose',      label: 'Розовый',      color: '#2a0d1a' },
  { id: 'slate',     label: 'Серый',        color: '#1a1a24' },
];

export function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState(15);
  const [background, setBackground] = useState('default');

  function applyTheme(t: Theme) {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem('axiom-theme', t);
  }

  function applyFontSize(size: number) {
    setFontSize(size);
    document.documentElement.style.setProperty('--text-base', `${size}px`);
    localStorage.setItem('axiom-font-size', String(size));
  }

  function applyBackground(bg: string, color: string) {
    setBackground(bg);
    const msgArea = document.querySelector('.messages') as HTMLElement;
    if (msgArea && color) msgArea.style.background = color;
    localStorage.setItem('axiom-bg', bg);
  }

  // Restore saved settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('axiom-theme') as Theme | null;
    const savedFont  = localStorage.getItem('axiom-font-size');
    if (savedTheme) applyTheme(savedTheme);
    if (savedFont)  applyFontSize(parseInt(savedFont, 10));
  }, []);

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Интерфейс</h3>

      {/* Theme */}
      <div className={styles.settingGroup}>
        <span className={styles.groupLabel}>Тема</span>
        <div className={styles.themeGrid}>
          {THEMES.map(t => (
            <button
              key={t.id}
              className={[styles.themeBtn, theme === t.id ? styles.themeBtnActive : ''].join(' ').trim()}
              onClick={() => applyTheme(t.id)}
            >
              <span
                className={styles.themePreview}
                style={{ background: t.preview }}
              />
              <span className={styles.themeLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className={styles.settingGroup}>
        <span className={styles.groupLabel}>Размер шрифта</span>
        <div className={styles.radioGroup}>
          {FONT_SIZES.map(f => (
            <label key={f.value} className={styles.radioLabel}>
              <input
                type="radio"
                name="font-size"
                value={f.value}
                checked={fontSize === f.value}
                onChange={() => applyFontSize(f.value)}
                className={styles.radioInput}
              />
              <span>{f.label} ({f.value}px)</span>
            </label>
          ))}
        </div>
      </div>

      {/* Chat background */}
      <div className={styles.settingGroup}>
        <span className={styles.groupLabel}>Фон чата</span>
        <div className={styles.bgGrid}>
          {CHAT_BACKGROUNDS.map(bg => (
            <button
              key={bg.id}
              className={[styles.bgBtn, background === bg.id ? styles.bgBtnActive : ''].join(' ').trim()}
              onClick={() => applyBackground(bg.id, bg.color)}
              title={bg.label}
            >
              <span
                className={styles.bgPreview}
                style={{ background: bg.color || 'linear-gradient(135deg, #07070F, #1a1a2e)' }}
              />
              <span className={styles.bgLabel}>{bg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
