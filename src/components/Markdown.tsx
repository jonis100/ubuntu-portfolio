import { Fragment, type ReactNode } from 'react';

/**
 * A deliberately small Markdown renderer. The project READMEs are authored in
 * this repo, so we control the subset used and don't need a parser dependency:
 * headings, fenced code, blockquotes, bullet lists, inline code and bold.
 */

const FENCE = '```';
const HEADING = /^(#{1,4})\s+(.*)$/;
const BULLET = /^[-*]\s+/;
const NUMBERED = /^\d+\.\s+/;
/** An indented line continues the list item above it. */
const CONTINUATION = /^\s{2,}\S/;

/** True for any line that starts a block, and so ends a paragraph. */
function startsBlock(line: string): boolean {
  return (
    line.startsWith(FENCE) ||
    line.startsWith('>') ||
    HEADING.test(line) ||
    BULLET.test(line) ||
    NUMBERED.test(line)
  );
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on `code` and **bold**, keeping the delimiters.
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  parts.forEach((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code key={key} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] text-accent">
          {part.slice(1, -1)}
        </code>,
      );
    } else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push(
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>,
      );
    } else if (part) {
      out.push(<Fragment key={key}>{part}</Fragment>);
    }
  });

  return out;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];

  let i = 0;
  let key = 0;

  /** Consume consecutive list items, folding continuation lines into each. */
  function takeListItems(marker: RegExp): string[] {
    const items: string[] = [];
    while (i < lines.length && marker.test(lines[i])) {
      let item = lines[i].replace(marker, '');
      i++;
      while (i < lines.length && CONTINUATION.test(lines[i])) {
        item += ` ${lines[i].trim()}`;
        i++;
      }
      items.push(item);
    }
    return items;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith(FENCE)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(FENCE)) body.push(lines[i++]);
      i++; // closing fence
      blocks.push(
        <pre
          key={key++}
          className="scroll-thin my-4 overflow-x-auto rounded-lg border border-edge bg-bg p-4 font-mono text-[13px] leading-relaxed text-dim"
        >
          {body.join('\n')}
        </pre>,
      );
      continue;
    }

    // Headings
    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1].length;
      const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base'];
      const Tag = (['h1', 'h2', 'h3', 'h4'] as const)[level - 1];
      blocks.push(
        <Tag key={key} className={`mb-3 mt-6 font-semibold text-ink first:mt-0 ${sizes[level - 1]}`}>
          {inline(heading[2], `h${key++}`)}
        </Tag>,
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={key}
          className="my-4 border-l-4 border-accent/60 bg-surface-2/60 py-2 pl-4 pr-3 text-dim"
        >
          {inline(body.join(' '), `q${key++}`)}
        </blockquote>,
      );
      continue;
    }

    // Lists — bulleted and numbered differ only in marker and wrapper.
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      const items = takeListItems(ordered ? NUMBERED : BULLET);
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List
          key={key}
          className={`my-3 space-y-1.5 pl-5 text-dim marker:text-accent ${
            ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {items.map((item, n) => (
            <li key={n}>{inline(item, `l${key}-${n}`)}</li>
          ))}
        </List>,
      );
      key++;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — gather until a blank line or the start of another block.
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key} className="my-3 leading-relaxed text-dim">
        {inline(para.join(' '), `p${key++}`)}
      </p>,
    );
  }

  return <div className="text-[15px]">{blocks}</div>;
}
