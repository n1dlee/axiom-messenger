import { invoke } from '@tauri-apps/api/core';
import type { Poll } from '../../store/types';
import styles from './PollMessage.module.css';

interface Props {
  poll: Poll;
  messageId: number;
  chatId: number;
}

export function PollMessage({ poll, messageId, chatId }: Props) {
  const totalVotes = poll.totalVoterCount;
  const hasVoted = poll.userSelectedOptions.length > 0;
  const showResults = hasVoted || poll.isClosed;

  async function vote(optionIndex: number) {
    if (hasVoted || poll.isClosed) return;
    try {
      await invoke('set_poll_answer', {
        chatId,
        messageId,
        optionIds: [optionIndex],
      });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  }

  return (
    <div className={styles.poll}>
      <div className={styles.header}>
        <span className={styles.badge}>
          {poll.isQuiz ? '🧠 Викторина' : '📊 Опрос'}
          {poll.isAnonymous && ' · Анонимный'}
        </span>
        {poll.isClosed && <span className={styles.closed}>Завершён</span>}
      </div>

      <p className={styles.question}>{poll.question}</p>

      <div className={styles.options}>
        {poll.options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.voterCount / totalVotes) * 100) : 0;
          const isCorrect = poll.isQuiz && poll.correctOptionId === i;
          const isWrong = poll.isQuiz && opt.isChosen && !isCorrect && showResults;

          return (
            <button
              key={i}
              className={[
                styles.option,
                opt.isChosen ? styles.chosen : '',
                isCorrect && showResults ? styles.correct : '',
                isWrong ? styles.wrong : '',
                hasVoted || poll.isClosed ? styles.voted : '',
              ].filter(Boolean).join(' ')}
              onClick={() => vote(i)}
              disabled={hasVoted || poll.isClosed}
            >
              <div className={styles.optionTop}>
                <span className={styles.optionText}>{opt.text}</span>
                {showResults && (
                  <span className={styles.optionPct}>{pct}%</span>
                )}
                {opt.isChosen && (
                  <span className={styles.checkMark}>
                    {isWrong ? '✗' : '✓'}
                  </span>
                )}
                {isCorrect && showResults && !opt.isChosen && (
                  <span className={styles.checkMark}>✓</span>
                )}
              </div>
              {showResults && (
                <div className={styles.bar}>
                  <div
                    className={[
                      styles.barFill,
                      isCorrect ? styles.barCorrect : '',
                      isWrong ? styles.barWrong : '',
                    ].filter(Boolean).join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        {totalVotes === 0
          ? 'Нет голосов'
          : `${totalVotes} ${voteWord(totalVotes)}`}
      </div>
    </div>
  );
}

function voteWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'голосов';
  if (mod10 === 1) return 'голос';
  if (mod10 >= 2 && mod10 <= 4) return 'голоса';
  return 'голосов';
}
