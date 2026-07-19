import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, type ChatSource, type ChatTurn } from '../../lib/api';
import { LANGUAGES } from './languages';

interface Message extends ChatTurn {
  sources?: ChatSource[];
}

const SUGGESTIONS = [
  'Where is the nearest step-free exit?',
  'How do I get to the metro?',
  'Where can I refill my water bottle?',
];

/**
 * Fan Copilot chat view. Sends the user's question (plus recent history and the
 * chosen language) to the RAG-grounded `/api/chat` endpoint and renders the
 * conversation. The transcript is an `aria-live` region so screen readers
 * announce assistant replies; answers show their venue sources.
 */
export default function FanCopilot() {
  const [language, setLanguage] = useState<string>('English');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const listEndRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: (message: string) =>
      api.chat({
        message,
        language,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, sources: res.sources },
      ]);
      queueMicrotask(() =>
        listEndRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
      );
    },
  });

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    chat.mutate(trimmed);
  };

  return (
    <section
      aria-labelledby="copilot-heading"
      className="flex flex-1 flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-4">
        <p id="copilot-heading" className="sr-only">
          Fan Copilot
        </p>
        <p className="text-content-muted text-sm">
          Your multilingual guide to the venue.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-content-muted">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-surface-2 bg-surface-2 px-2 py-1.5 text-content focus:border-primary"
            aria-label="Response language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Conversation transcript */}
      <div
        className="flex min-h-[22rem] flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-surface-2/60 bg-surface p-4 sm:p-5"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div className="m-auto max-w-sm text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-2xl"
            >
              💬
            </div>
            <p className="font-heading text-lg font-semibold">
              Ask me anything
            </p>
            <p className="text-content-muted mt-1 text-sm">
              Navigation, accessibility, transport, or amenities — in your language.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={i}
              className={'flex items-start gap-3 ' + (isUser ? 'flex-row-reverse' : '')}
            >
              <span
                aria-hidden="true"
                className={
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ' +
                  (isUser ? 'bg-surface-2' : 'bg-primary text-white')
                }
              >
                {isUser ? '🙂' : 'F'}
              </span>
              <div
                className={
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ' +
                  (isUser
                    ? 'rounded-tr-sm bg-primary text-white'
                    : 'rounded-tl-sm bg-surface-2 text-content')
                }
              >
                <span className="sr-only">
                  {isUser ? 'You said: ' : 'Assistant replied: '}
                </span>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                {m.sources && m.sources.length > 0 && (
                  <p className="text-content-muted mt-2 border-t border-white/10 pt-2 text-xs">
                    Sources: {m.sources.map((s) => s.title).join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {chat.isPending && (
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm text-white"
            >
              F
            </span>
            <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-content-muted [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-content-muted [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-content-muted" />
            </div>
          </div>
        )}
        {chat.isError && (
          <p className="text-status-crit self-start text-sm" role="alert">
            {(chat.error as Error).message}
          </p>
        )}
        <div ref={listEndRef} />
      </div>

      {messages.length === 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => submit(s)}
                className="rounded-full border border-surface-2 px-3 py-1.5 text-xs text-content-muted transition-colors hover:border-primary hover:text-content"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2 rounded-lg border border-surface-2/60 bg-surface p-2"
      >
        <label htmlFor="copilot-input" className="sr-only">
          Ask the Fan Copilot a question
        </label>
        <input
          id="copilot-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          autoComplete="off"
          className="flex-1 rounded-md bg-transparent px-3 py-2 text-content placeholder:text-content-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={chat.isPending || !input.trim()}
          className="rounded-md bg-primary px-5 py-2 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
