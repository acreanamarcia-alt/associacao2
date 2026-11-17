import type { ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Match markdown links [label](url), bold **text**, or bare https?:// URLs
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s<>()]+))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2] && match[3]) {
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#14532D] underline underline-offset-2 hover:text-[#0F3F22]"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-[#1C1917]">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      const cleanUrl = match[5].replace(/[.,;)]+$/, '');
      const trailing = match[5].slice(cleanUrl.length);
      parts.push(
        <a
          key={`url-${keyIdx++}`}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-[#14532D] underline underline-offset-2 hover:text-[#0F3F22]"
        >
          {cleanUrl}
        </a>
      );
      if (trailing) {
        parts.push(trailing);
      }
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let keyCounter = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listOrdered) {
      blocks.push(
        <ol
          key={`ol-${keyCounter++}`}
          className="my-2.5 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[#44403C]"
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul
          key={`ul-${keyCounter++}`}
          className="my-2.5 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#44403C]"
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (/^---+$/.test(line)) {
      flushList();
      blocks.push(<hr key={`hr-${keyCounter++}`} className="my-5 border-[#E2DDD3]" />);
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      blocks.push(
        <h4
          key={`h-${keyCounter++}`}
          className="mt-5 mb-2 font-serif text-lg font-semibold text-[#1C1917]"
        >
          {renderInline(headingMatch[2])}
        </h4>
      );
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (listOrdered && listItems.length > 0) flushList();
      listOrdered = false;
      listItems.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (!listOrdered && listItems.length > 0) flushList();
      listOrdered = true;
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${keyCounter++}`} className="my-2 text-sm leading-relaxed text-[#44403C]">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return <div>{blocks}</div>;
}
