import { getNode, isDir, prettyPath } from '@/data/filesystem';
import Markdown from '@/components/Markdown';
import type { AppProps } from '@/os/types';

type ReaderPayload = { path: string };

/** GNOME Text Editor: renders a file from the virtual filesystem. */
export default function Reader({ payload }: AppProps) {
  const path = (payload as ReaderPayload | undefined)?.path;
  const node = path ? getNode(path) : undefined;

  if (!path || !node) {
    return (
      <div className="grid h-full place-items-center bg-bg p-8 text-center text-dim">
        <p>No document open. Open a file from the Files app.</p>
      </div>
    );
  }

  if (isDir(node)) {
    return (
      <div className="grid h-full place-items-center bg-bg p-8 text-dim">
        <p>{prettyPath(path)} is a folder.</p>
      </div>
    );
  }

  const isMarkdown = node.name.endsWith('.md');

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="shrink-0 border-b border-edge bg-header px-4 py-1.5 text-xs text-faint">
        {prettyPath(path)}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-2xl">
          {isMarkdown ? (
            <Markdown source={node.content} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-[13.5px] leading-relaxed text-dim">
              {node.content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
