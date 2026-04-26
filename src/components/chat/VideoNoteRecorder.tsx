import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './VideoNoteRecorder.module.css';

interface Props {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VideoNoteRecorder({ onSend, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_DURATION = 60; // Telegram limit

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      chunksRef.current = [];
      const mimeType =
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
        MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(secs);
        if (secs >= MAX_DURATION) stopAndSend();
      }, 500);
    } catch (err) {
      setError('Нет доступа к камере');
      console.error(err);
    }
  }, []);

  const stopAndSend = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      onSend(blob, duration);
    };

    mr.stop();
    cleanup();
  }, [onSend]);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }

  function handleCancel() {
    mediaRecorderRef.current?.stop();
    cleanup();
    onCancel();
  }

  useEffect(() => {
    startRecording();
    return cleanup;
  }, []);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const progress = Math.min(elapsed / MAX_DURATION, 1);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - progress * circumference;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {error ? (
          <div className={styles.error}>
            <span>{error}</span>
            <button className={styles.cancelBtn} onClick={handleCancel}>Закрыть</button>
          </div>
        ) : (
          <>
            {/* Circular video preview with progress ring */}
            <div className={styles.videoWrap}>
              <svg className={styles.progressRing} viewBox="0 0 100 100">
                <circle
                  className={styles.progressBg}
                  cx="50" cy="50" r={radius}
                  fill="none" strokeWidth="4"
                />
                <circle
                  className={styles.progressBar}
                  cx="50" cy="50" r={radius}
                  fill="none" strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <video ref={videoRef} className={styles.video} playsInline muted autoPlay />
            </div>

            {/* Timer */}
            <div className={styles.timer}>
              {isRecording && <span className={styles.recDot} />}
              {formatTime(elapsed)} / {formatTime(MAX_DURATION)}
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              <button className={styles.cancelBtn} onClick={handleCancel} aria-label="Отмена">
                ✕
              </button>
              <button className={styles.sendBtn} onClick={stopAndSend} aria-label="Отправить">
                <SendIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
