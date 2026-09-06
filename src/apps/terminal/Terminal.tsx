import { useEffect, useRef, useState } from 'react';
import { HOME, prettyPath } from '@/data/filesystem';
import { profile } from '@/data/profile';
import { useOS } from '@/os/store';
import type { AppProps } from '@/os/types';
import {
  complete,
  runCommand,
  sudoDenial,
  sudoPrompt,
  sudoRetry,
  type Line,
  type Tone,
} from './commands';

type Entry = { prompt?: string; lines: Line[] };

const TONE: Record<Tone, string> = {
  normal: 'text-[#d3d7cf]',
  dim: 'text-[#8b8a88]',
  accent: 'text-[#e95420]',
  error: 'text-[#ef5350]',
  success: 'text-[#8ae234]',
  white: 'text-white',
};

const BANNER: Line[] = [
  { text: `Welcome to ${profile.name}'s portfolio shell.`, tone: 'accent' },
  { text: '' },
  { text: `Type 'help' to see what this thing does, or 'neofetch' to show off.`, tone: 'dim' },
  { text: '' },
];

export default function Terminal({ winId }: AppProps) {
  const openApp = useOS((s) => s.openApp);
  const close = useOS((s) => s.close);
  const [cwd, setCwd] = useState(HOME);
  const [history, setHistory] = useState<Entry[]>([{ lines: BANNER }]);
  const [input, setInput] = useState('');
  const [past, setPast] = useState<string[]>([]);
  const [pastIndex, setPastIndex] = useState<number | null>(null);
  /** Non-null while sudo is collecting a password. */
  const [sudo, setSudo] = useState<{ args: string[]; attempts: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prompt = `${profile.username}@${profile.hostname}:${prettyPath(cwd)}$`;

  // Keep the newest output in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  // Focus the input when the terminal first opens.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** sudo's password loop: three attempts, no echo, then the refusal. */
  function submitPassword(pending: { args: string[]; attempts: number }) {
    const attempts = pending.attempts + 1;
    const done = attempts >= 3;

    setHistory((h) => [
      ...h,
      {
        prompt: sudoPrompt(),
        // Empty echo: real sudo never shows what you typed.
        lines: [{ text: '' }, ...(done ? sudoDenial(pending.args) : [sudoRetry()])],
      },
    ]);
    setSudo(done ? null : { ...pending, attempts });
    setInput('');
  }

  function submit() {
    if (sudo) {
      submitPassword(sudo);
      return;
    }

    const value = input;
    const entryPrompt = prompt;

    // A command may ask for the scrollback to be emptied, in which case its own
    // echo goes with it — `clear` should not leave itself behind.
    let cleared = false;
    const lines = runCommand(value, {
      cwd,
      setCwd,
      clear: () => {
        cleared = true;
      },
      openApp,
      askPassword: (args) => setSudo({ args, attempts: 0 }),
    });

    setHistory((h) =>
      cleared ? [] : [...h, { prompt: entryPrompt, lines: [{ text: value }, ...lines] }],
    );
    if (value.trim()) setPast((p) => [...p, value]);
    setPastIndex(null);
    setInput('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      return;
    }

    if (sudo && (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const completed = complete(input, cwd);
      if (completed) setInput(completed);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (past.length === 0) return;
      const next = pastIndex === null ? past.length - 1 : Math.max(0, pastIndex - 1);
      setPastIndex(next);
      setInput(past[next]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pastIndex === null) return;
      const next = pastIndex + 1;
      if (next >= past.length) {
        setPastIndex(null);
        setInput('');
      } else {
        setPastIndex(next);
        setInput(past[next]);
      }
      return;
    }

    // Ctrl+C abandons the sudo prompt, as in a real shell.
    if (e.ctrlKey && e.key === 'c' && sudo) {
      e.preventDefault();
      setHistory((h) => [...h, { prompt: sudoPrompt(), lines: [{ text: '^C' }] }]);
      setSudo(null);
      setInput('');
      return;
    }

    // Ctrl+L clears, Ctrl+D closes — as they do in a real terminal.
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setHistory([]);
      return;
    }
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      close(winId);
    }
  }

  return (
    <div
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
      className="scroll-thin h-full overflow-y-auto bg-[#300a24] p-3 font-mono text-[13.5px] leading-[1.45] text-[#d3d7cf]"
    >
      {history.map((entry, i) => (
        <div key={i}>
          {entry.prompt && (
            <div className="flex gap-2">
              <span className="shrink-0 text-[#8ae234]">{entry.prompt}</span>
              <span className="whitespace-pre-wrap break-all">{entry.lines[0]?.text}</span>
            </div>
          )}
          {(entry.prompt ? entry.lines.slice(1) : entry.lines).map((line, j) => (
            <div key={j} className={`whitespace-pre ${TONE[line.tone ?? 'normal']}`}>
              {line.spans
                ? line.spans.map((span, k) => (
                    <span
                      key={k}
                      className={`${TONE[span.tone ?? 'normal']} ${span.bold ? 'font-bold' : ''}`}
                      style={span.bg ? { backgroundColor: span.bg } : undefined}
                    >
                      {span.text}
                    </span>
                  ))
                : line.text || ' '}
            </div>
          ))}
        </div>
      ))}

      <div className="flex gap-2">
        <label
          htmlFor={`term-${winId}`}
          className={`shrink-0 ${sudo ? 'text-[#ef5350]' : 'text-[#8ae234]'}`}
        >
          {sudo ? sudoPrompt() : prompt}
        </label>
        <div className="relative flex-1">
          <input
            id={`term-${winId}`}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label={sudo ? 'Password' : 'Terminal input'}
            className={`w-full bg-transparent font-mono text-[13.5px] caret-transparent outline-none ${
              sudo ? 'text-transparent' : 'text-[#d3d7cf]'
            }`}
          />
          {/* Block cursor. It stays put during a password: sudo echoes nothing,
              so a moving cursor would give away the length of what you typed. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 inline-block h-[1.45em] w-[0.6em] animate-pulse bg-[#d3d7cf]/80"
            style={{ left: sudo ? 0 : `${input.length * 0.6}em` }}
          />
        </div>
      </div>
    </div>
  );
}
