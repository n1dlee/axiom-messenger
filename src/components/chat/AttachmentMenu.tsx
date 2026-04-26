import { open } from '@tauri-apps/plugin-dialog';
import styles from './AttachmentMenu.module.css';

interface Props {
  onSendPhoto: (path: string) => void;
  onSendVideo: (path: string) => void;
  onSendDocument: (path: string) => void;
  onClose: () => void;
}

export function AttachmentMenu({ onSendPhoto, onSendVideo, onSendDocument, onClose }: Props) {
  async function pickPhoto() {
    const result = await open({
      multiple: false,
      filters: [{ name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic', 'heif'] }],
    });
    if (typeof result === 'string') { onSendPhoto(result); onClose(); }
  }

  async function pickVideo() {
    const result = await open({
      multiple: false,
      filters: [{ name: 'Видео', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v', '3gp'] }],
    });
    if (typeof result === 'string') { onSendVideo(result); onClose(); }
  }

  async function pickDocument() {
    const result = await open({ multiple: false });
    if (typeof result === 'string') { onSendDocument(result); onClose(); }
  }

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.menu} role="menu" aria-label="Прикрепить файл">
        <button className={styles.item} role="menuitem" onClick={pickPhoto}>
          <span className={styles.itemIcon}>🖼</span>
          <span className={styles.itemLabel}>Фото</span>
        </button>

        <button className={styles.item} role="menuitem" onClick={pickVideo}>
          <span className={styles.itemIcon}>🎬</span>
          <span className={styles.itemLabel}>Видео</span>
        </button>

        <button className={styles.item} role="menuitem" onClick={pickDocument}>
          <span className={styles.itemIcon}>📎</span>
          <span className={styles.itemLabel}>Файл</span>
        </button>
      </div>
    </>
  );
}
