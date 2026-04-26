import type { ReactNode } from 'react';
import type { TextEntity } from '../store/types';

/**
 * Renders a TDLib formattedText string with entities into React nodes.
 * Supports URLs, bold, italic, underline, strikethrough, code, pre, mention, textUrl.
 */
export function renderFormattedText(text: string, entities?: TextEntity[]): ReactNode {
  if (!entities || entities.length === 0) {
    return renderPlainUrls(text);
  }

  // Sort entities by offset ascending
  const sorted = [...entities].sort((a, b) => a.offset - b.offset);
  const nodes: ReactNode[] = [];
  let pos = 0;

  for (const entity of sorted) {
    const { offset, length, type, url } = entity;
    if (offset < pos) continue; // overlapping entity — skip

    // Text before this entity
    if (offset > pos) {
      nodes.push(renderPlainUrls(text.slice(pos, offset), `pre-${pos}`));
    }

    const slice = text.slice(offset, offset + length);

    switch (type) {
      case 'textEntityTypeUrl':
        nodes.push(
          <a key={`e-${offset}`} href={slice} target="_blank" rel="noreferrer noopener"
            onClick={e => { e.preventDefault(); openUrl(slice); }}>
            {slice}
          </a>
        );
        break;
      case 'textEntityTypeTextUrl':
        nodes.push(
          <a key={`e-${offset}`} href={url ?? slice} target="_blank" rel="noreferrer noopener"
            onClick={e => { e.preventDefault(); openUrl(url ?? slice); }}>
            {slice}
          </a>
        );
        break;
      case 'textEntityTypeBold':
        nodes.push(<strong key={`e-${offset}`}>{slice}</strong>);
        break;
      case 'textEntityTypeItalic':
        nodes.push(<em key={`e-${offset}`}>{slice}</em>);
        break;
      case 'textEntityTypeUnderline':
        nodes.push(<u key={`e-${offset}`}>{slice}</u>);
        break;
      case 'textEntityTypeStrikethrough':
        nodes.push(<s key={`e-${offset}`}>{slice}</s>);
        break;
      case 'textEntityTypeCode':
        nodes.push(<code key={`e-${offset}`} style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,.15)', padding: '1px 4px', borderRadius: 3 }}>{slice}</code>);
        break;
      case 'textEntityTypePre':
      case 'textEntityTypePreCode':
        nodes.push(<pre key={`e-${offset}`} style={{ display: 'inline', fontFamily: 'monospace', background: 'rgba(0,0,0,.15)', padding: '1px 4px', borderRadius: 3 }}>{slice}</pre>);
        break;
      case 'textEntityTypeMention':
        nodes.push(
          <span key={`e-${offset}`} style={{ color: 'var(--accent-400)', cursor: 'pointer' }}>{slice}</span>
        );
        break;
      case 'textEntityTypeMentionName':
        nodes.push(
          <span key={`e-${offset}`} style={{ color: 'var(--accent-400)', cursor: 'pointer' }}>{slice}</span>
        );
        break;
      case 'textEntityTypeHashtag':
      case 'textEntityTypeCashtag':
      case 'textEntityTypeBotCommand':
        nodes.push(
          <span key={`e-${offset}`} style={{ color: 'var(--accent-400)' }}>{slice}</span>
        );
        break;
      case 'textEntityTypeSpoiler':
        nodes.push(
          <span key={`e-${offset}`}
            style={{ background: 'var(--text-muted)', color: 'var(--text-muted)', borderRadius: 3, cursor: 'pointer' }}
            title="Спойлер">
            {slice}
          </span>
        );
        break;
      default:
        nodes.push(<span key={`e-${offset}`}>{slice}</span>);
    }

    pos = offset + length;
  }

  // Remaining text after last entity
  if (pos < text.length) {
    nodes.push(renderPlainUrls(text.slice(pos), `post-${pos}`));
  }

  return <>{nodes}</>;
}

/** Fallback: auto-link bare URLs when no entities are provided */
function renderPlainUrls(text: string, key?: string): ReactNode {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const href = match[0];
    parts.push(
      <a key={`url-${match.index}`} href={href} target="_blank" rel="noreferrer noopener"
        onClick={e => { e.preventDefault(); openUrl(href); }}>
        {href}
      </a>
    );
    last = match.index + href.length;
  }

  if (parts.length === 0) return key ? <span key={key}>{text}</span> : text;
  if (last < text.length) parts.push(text.slice(last));
  return <span key={key}>{parts}</span>;
}

function openUrl(url: string) {
  // Use Tauri opener if available, fall back to window.open
  import('@tauri-apps/plugin-opener').then(({ openUrl: open }) => open(url)).catch(() => {
    window.open(url, '_blank', 'noreferrer');
  });
}
