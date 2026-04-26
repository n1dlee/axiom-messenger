import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { Message } from '../../store/types';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './VoiceMessage.module.css';

interface Props {
  message: Message;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** 20-bar waveform with progress highlight */
function Waveform({ progress }: { progress: number }) {
  const bars = [...Array(20)].map((_, i) => {
    const h = 8 + Math.sin(i * 0.8) * 8;
    const filled = progress > 0 && i / 20 <= progress;
    return (
      <div
        key={i}
        className={[styles.bar, filled ? styles.barFilled : ''].join(' ').trim()}
        style={{ height: `${h}px` }}
      />
    );
  });
  return <div className={styles.waveform}>{bars}</div>;
}

export function VoiceMessage({ message }: Props) {
  const { fileId, localPath, duration } = message;
  const tdlib = useTdlib();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(Boolean(localPath));

  // Download the file if needed
  useEffect(() => {
    if (fileId && !localPath) {
      tdlib.downloadFile(fileId);
    }
  }, [fileId, localPath]);

  // When localPath arrives, update ready flag
  useEffect(() => {
    setReady(Boolean(localPath));
  }, [localPath]);

  const fileSrc = localPath ? convertFileSrc(localPath) : null;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !fileSrc) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration || duration || 1;
    setElapsed(audio.currentTime);
    setProgress(audio.currentTime / dur);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * (audio.duration || 0);
  }

  function cycleSpeed() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    audio.playbackRate = next;
    setSpeed(next);
  }

  return (
    <div className={styles.root}>
      {fileSrc && (
        <audio
          ref={audioRef}
          src={fileSrc}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(0); setElapsed(0); }}
          onTimeUpdate={handleTimeUpdate}
          preload="metadata"
        />
      )}

      {/* Play / pause button */}
      <button
        className={[styles.playBtn, !ready ? styles.playBtnDisabled : ''].join(' ').trim()}
        onClick={togglePlay}
        disabled={!ready}
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
      >
        {!ready ? (
          <span className={styles.spinner} />
        ) : playing ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      {/* Waveform — clickable to seek */}
      <div className={styles.waveformWrap} onClick={handleSeek} role="slider"
        aria-label="Прогресс воспроизведения" aria-valuenow={Math.round(progress * 100)}>
        <Waveform progress={progress} />
      </div>

      {/* Time display */}
      <span className={styles.time}>
        {elapsed > 0 ? formatTime(elapsed) : formatTime(duration ?? 0)}
      </span>

      {/* Speed toggle */}
      {ready && (
        <button
          className={styles.speedBtn}
          onClick={cycleSpeed}
          title={`Скорость: ${speed}x`}
        >
          {speed}×
        </button>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  );
}
