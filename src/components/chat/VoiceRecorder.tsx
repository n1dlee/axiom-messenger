import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './VoiceRecorder.module.css';

interface Props {
  chatId: number;
  replyToId?: number;
  onSent: () => void;
  onCancel: () => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:...;base64," prefix
      resolve(dataUrl.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function VoiceRecorder({ chatId, replyToId, onSent, onCancel }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => stopTimer();
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg;codecs=opus';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRef.current = recorder;
      setRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err: any) {
      setError(err.message ?? 'Нет доступа к микрофону');
    }
  }

  async function handleSend() {
    if (!mediaRef.current || sending) return;
    setSending(true);
    stopTimer();

    const recorder = mediaRef.current;
    recorder.stream.getTracks().forEach(t => t.stop());

    await new Promise<void>(resolve => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
    const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const ext = recorder.mimeType.includes('ogg') ? 'ogg' : 'webm';

    try {
      const b64 = await blobToBase64(blob);
      const path = await invoke<string>('write_temp_file', { dataB64: b64, extension: ext });
      await invoke('send_voice_note', {
        chatId,
        localPath: path,
        duration: durationSec,
        replyToId: replyToId ?? null,
      });
      onSent();
    } catch (err: any) {
      setError(err.message ?? 'Ошибка отправки');
      setSending(false);
    }
  }

  function handleCancel() {
    if (mediaRef.current) {
      mediaRef.current.stream.getTracks().forEach(t => t.stop());
      if (mediaRef.current.state !== 'inactive') mediaRef.current.stop();
    }
    stopTimer();
    onCancel();
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className={styles.recorder}>
      {error ? (
        <div className={styles.error}>
          <span>{error}</span>
          <button className={styles.cancelBtn} onClick={handleCancel}>✕</button>
        </div>
      ) : (
        <>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={sending}
            title="Отменить"
          >
            🗑
          </button>

          <div className={styles.waveform}>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={[styles.bar, recording ? styles.barAnimated : ''].join(' ')}
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>

          <span className={styles.duration}>{formatTime(duration)}</span>

          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={sending || !recording}
            title="Отправить"
          >
            {sending ? '…' : '✓'}
          </button>
        </>
      )}
    </div>
  );
}
