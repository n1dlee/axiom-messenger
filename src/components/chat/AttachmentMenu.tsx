import { useRef, type ChangeEvent } from 'react';
import styles from './AttachmentMenu.module.css';

interface Props {
  onSendPhoto: (path: string) => void;
  onSendVideo: (path: string) => void;
  onSendDocument: (path: string) => void;
  onClose: () => void;
}

export function AttachmentMenu({ onSendPhoto, onSendVideo, onSendDocument, onClose }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to a path-like string for Tauri
    // In Tauri 2, we need to use dialog plugin for native path picking
    // For now, use object URL as placeholder
    onSendPhoto(file.name);
    onClose();
  }

  function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onSendVideo(file.name);
    onClose();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onSendDocument(file.name);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.menu} role="menu" aria-label="Прикрепить файл">
        <button
          className={styles.item}
          role="menuitem"
          onClick={() => photoRef.current?.click()}
        >
          <span className={styles.itemIcon}>🖼</span>
          <span className={styles.itemLabel}>Фото или видео</span>
        </button>

        <button
          className={styles.item}
          role="menuitem"
          onClick={() => fileRef.current?.click()}
        >
          <span className={styles.itemIcon}>📎</span>
          <span className={styles.itemLabel}>Файл</span>
        </button>

        <button
          className={styles.item}
          role="menuitem"
          onClick={() => videoRef.current?.click()}
        >
          <span className={styles.itemIcon}>🎬</span>
          <span className={styles.itemLabel}>Видео</span>
        </button>

        {/* Hidden file inputs */}
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handlePhotoChange}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          hidden
          onChange={handleVideoChange}
        />
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={handleFileChange}
        />
      </div>
    </>
  );
}
