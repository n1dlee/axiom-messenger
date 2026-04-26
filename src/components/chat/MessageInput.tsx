import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent, type ChangeEvent } from 'react';
import type { Message } from '../../store/types';
import { ReplyPreview } from './ReplyPreview';
import { AttachmentMenu } from './AttachmentMenu';
import { VideoNoteRecorder } from './VideoNoteRecorder';
import { GifPicker } from '../picker/GifPicker';
import styles from './MessageInput.module.css';

interface Props {
  onSend: (text: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  chatId?: number | null;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editMessage?: Message | null;
  onCancelEdit?: () => void;
  onSendPhoto?: (path: string) => void;
  onSendVideo?: (path: string) => void;
  onSendDocument?: (path: string) => void;
  onSendVideoNote?: (blob: Blob, duration: number) => void;
  onStartVoice?: () => void;
}

export function MessageInput({
  onSend, onTyping, disabled, chatId,
  replyTo, onCancelReply,
  editMessage, onCancelEdit,
  onSendPhoto, onSendVideo, onSendDocument, onSendVideoNote, onStartVoice,
}: Props) {
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [showVideoNote, setShowVideoNote] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachWrapRef = useRef<HTMLDivElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft when chat changes
  useEffect(() => {
    if (!chatId || editMessage) return;
    const saved = localStorage.getItem(`draft_${chatId}`) ?? '';
    setText(saved);
    // Resize textarea to match saved content
    requestAnimationFrame(() => autoResize());
  }, [chatId]);

  // Pre-fill text when entering edit mode
  useEffect(() => {
    if (editMessage) {
      setText(editMessage.text);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [editMessage?.id]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    // Clear saved draft on send
    if (chatId) localStorage.removeItem(`draft_${chatId}`);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if (editMessage) onCancelEdit?.();
      if (replyTo) onCancelReply?.();
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setText(val);
    autoResize();
    // Persist draft with 400ms debounce
    if (chatId && !editMessage) {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        if (val.trim()) {
          localStorage.setItem(`draft_${chatId}`, val);
        } else {
          localStorage.removeItem(`draft_${chatId}`);
        }
      }, 400);
    }
    // Send typing action (debounced every 3s)
    if (onTyping && val.length > 0) {
      if (!typingTimeoutRef.current) {
        onTyping();
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 3000);
      }
    }
  }

  const isEditing = Boolean(editMessage);
  const placeholder = isEditing ? 'Редактировать сообщение…' : 'Написать сообщение…';

  return (
    <div className={styles.container}>
      {/* Reply preview bar */}
      {replyTo && !isEditing && (
        <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
      )}

      {/* Edit mode bar */}
      {isEditing && (
        <div className={styles.editBar}>
          <span className={styles.editIcon}>✏️</span>
          <div className={styles.editInfo}>
            <span className={styles.editLabel}>Редактирование</span>
            <span className={styles.editOriginal}>
              {editMessage?.text.slice(0, 60) ?? ''}
            </span>
          </div>
          <button className={styles.cancelBtn} onClick={onCancelEdit} aria-label="Отменить редактирование">
            ✕
          </button>
        </div>
      )}

      <form className={styles.root} onSubmit={handleSubmit}>
        <div className={styles.inner}>
          {/* Attach button */}
          <div ref={attachWrapRef} className={styles.attachWrap}>
            <button
              type="button"
              className={[styles.iconBtn, showAttach ? styles.iconBtnActive : ''].join(' ').trim()}
              aria-label="Прикрепить файл"
              disabled={disabled}
              onClick={() => setShowAttach(v => !v)}
            >
              <AttachIcon />
            </button>
            {showAttach && (
              <AttachmentMenu
                onSendPhoto={path => { onSendPhoto?.(path); setShowAttach(false); }}
                onSendVideo={path => { onSendVideo?.(path); setShowAttach(false); }}
                onSendDocument={path => { onSendDocument?.(path); setShowAttach(false); }}
                onClose={() => setShowAttach(false)}
              />
            )}
          </div>

          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={placeholder}
            value={text}
            rows={1}
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-label="Поле ввода сообщения"
          />

          {/* GIF button */}
          {!isEditing && chatId && (
            <button
              type="button"
              className={[styles.iconBtn, showGif ? styles.iconBtnActive : ''].join(' ').trim()}
              aria-label="GIF"
              disabled={disabled}
              onClick={() => setShowGif(v => !v)}
              title="GIF"
            >
              <GifIcon />
            </button>
          )}

          {/* Voice note button (visible only when text is empty) */}
          {!text.trim() && !isEditing && onStartVoice && (
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Записать голосовое сообщение"
              disabled={disabled}
              onClick={onStartVoice}
              title="Голосовое сообщение"
            >
              <MicIcon />
            </button>
          )}

          {/* Video note button (visible only when text is empty) */}
          {!text.trim() && !isEditing && onSendVideoNote && (
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Записать видеосообщение"
              disabled={disabled}
              onClick={() => setShowVideoNote(true)}
              title="Видеосообщение (кружочек)"
            >
              <VideoNoteIcon />
            </button>
          )}

          <button
            type="submit"
            className={[styles.sendBtn, text.trim() ? styles.active : ''].join(' ').trim()}
            disabled={!text.trim() || disabled}
            aria-label={isEditing ? 'Сохранить изменения' : 'Отправить'}
          >
            {isEditing ? <CheckIcon /> : <SendIcon />}
          </button>
        </div>
      </form>

      {/* GIF picker — floats above the input bar */}
      {showGif && chatId && (
        <div className={styles.pickerAbove}>
          <GifPicker chatId={chatId} onClose={() => setShowGif(false)} />
        </div>
      )}

      {/* Video note recorder modal */}
      {showVideoNote && (
        <VideoNoteRecorder
          onSend={(blob, duration) => {
            onSendVideoNote?.(blob, duration);
            setShowVideoNote(false);
          }}
          onCancel={() => setShowVideoNote(false)}
        />
      )}
    </div>
  );
}

function VideoNoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function GifIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M8 12H6a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1v-2"/>
      <line x1="12" y1="9" x2="12" y2="15"/>
      <path d="M17 9h-2v6h2M17 12h-2"/>
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
