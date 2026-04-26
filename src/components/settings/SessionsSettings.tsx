import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './Settings.module.css';

interface Session {
  id: number;
  isCurrentSession: boolean;
  deviceModel: string;
  platform: string;
  applicationName: string;
  applicationVersion: string;
  country: string;
  ipAddress: string;
  lastActiveDate: number;
}

export function SessionsSettings() {
  const tdlib = useTdlib();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tdlib.getActiveSessions();
    const unlisten = listen<any>('td:sessions', ({ payload }) => {
      if (payload['@type'] === 'sessions') {
        setSessions(payload.sessions ?? []);
        setLoading(false);
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  async function handleTerminate(sessionId: number) {
    if (confirm('Завершить эту сессию?')) {
      await tdlib.terminateSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  }

  async function handleTerminateAll() {
    if (confirm('Завершить все другие сессии?')) {
      await tdlib.terminateAllOtherSessions();
      setSessions(prev => prev.filter(s => s.isCurrentSession));
    }
  }

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Активные сессии</h3>

      {loading ? (
        <p className={styles.loading}>Загрузка…</p>
      ) : (
        <>
          {sessions.length > 1 && (
            <button className={styles.dangerBtn} onClick={handleTerminateAll}>
              Завершить все другие сессии
            </button>
          )}

          <div className={styles.sessionList}>
            {sessions.map(session => (
              <div key={session.id} className={[styles.sessionItem, session.isCurrentSession ? styles.currentSession : ''].join(' ').trim()}>
                <div className={styles.sessionIcon}>
                  {getDeviceIcon(session.platform)}
                </div>
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionDevice}>
                    {session.deviceModel}
                    {session.isCurrentSession && (
                      <span className={styles.currentBadge}>Текущая сессия</span>
                    )}
                  </div>
                  <div className={styles.sessionDetails}>
                    {session.applicationName} {session.applicationVersion}
                    {session.country ? ` · ${session.country}` : ''}
                  </div>
                  <div className={styles.sessionDate}>
                    {session.isCurrentSession
                      ? 'Онлайн'
                      : `Последний вход: ${formatDate(session.lastActiveDate)}`}
                  </div>
                  {session.ipAddress && (
                    <div className={styles.sessionIp}>{session.ipAddress}</div>
                  )}
                </div>
                {!session.isCurrentSession && (
                  <button
                    className={styles.terminateBtn}
                    onClick={() => handleTerminate(session.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getDeviceIcon(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return '📱';
  if (p.includes('android')) return '🤖';
  if (p.includes('windows')) return '🖥️';
  if (p.includes('mac') || p.includes('darwin')) return '💻';
  if (p.includes('linux')) return '🐧';
  if (p.includes('web')) return '🌐';
  return '📱';
}
