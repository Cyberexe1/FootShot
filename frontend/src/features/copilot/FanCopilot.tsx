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
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="copilot-heading" className="font-heading text-2xl font-semibold">
          Fan Copilot
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-content-muted">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-sm bg-surface-2 px-2 py-1 text-content"
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

      {/* Conversation transcript. Assistant replies are announced politely. */}
      <div
        className="flex min-h-[16rem] flex-1 flex-col gap-3 overflow-y-auto rounded-md bg-surface p-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <p className="text-content-muted text-sm">
            Ask about navigation, accessibility, transport, or amenities.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'self-end rounded-md bg-primary px-3 py-2 text-sm text-white'
                : 'self-start rounded-md bg-surface-2 px-3 py-2 text-sm'
            }
          >
            <span className="sr-only">
              {m.role === 'user' ? 'You said: ' : 'Assistant replied: '}
            </span>
            {m.content}
            {m.sources && m.sources.length > 0 && (
              <p className="text-content-muted mt-2 text-xs">
                Sources: {m.sources.map((s) => s.title).join(', ')}
              </p>
            )}
          </div>
        ))}

        {chat.isPending && (
          <p className="text-content-muted self-start text-sm">Thinking…</p>
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
                className="rounded-full border border-surface-2 px-3 py-1 text-xs text-content-muted hover:border-primary hover:text-content"
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
        className="flex gap-2"
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
          className="flex-1 rounded-md bg-surface-2 px-3 py-2 text-content placeholder:text-content-muted"
        />
        <button
          type="submit"
          disabled={chat.isPending || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
