import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

const LANGUAGE_CHOICES = ['Spanish', 'French', 'Portuguese', 'Arabic', 'Japanese'];

export default function NotifyPanel() {
  const [message, setMessage] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Spanish', 'French']);

  const translate = useMutation({
    mutationFn: () => api.translate(message, languages),
  });

  const toggle = (lang: string) =>
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );

  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">
        Multilingual Announcement
      </h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim() && languages.length) translate.mutate();
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor="notify-message" className="sr-only">
          Announcement message
        </label>
        <textarea
          id="notify-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Announcement to translate and broadcast…"
          rows={2}
          className="rounded-sm bg-surface-2 px-3 py-2 text-sm"
        />

        <fieldset className="flex flex-wrap gap-3">
          <legend className="sr-only">Target languages</legend>
          {LANGUAGE_CHOICES.map((lang) => (
            <label key={lang} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={languages.includes(lang)}
                onChange={() => toggle(lang)}
              />
              {lang}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={translate.isPending || !message.trim() || !languages.length}
          className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {translate.isPending ? 'Translating…' : 'Translate & preview'}
        </button>
      </form>

      <div aria-live="polite" className="mt-3">
        {translate.isError && (
          <p className="text-status-crit text-sm" role="alert">
            {(translate.error as Error).message}
          </p>
        )}
        {translate.data && (
          <ul className="flex flex-col gap-2">
            {translate.data.translations.map((t) => (
              <li key={t.language} className="rounded-sm bg-surface-2 px-3 py-2 text-sm">
                <span className="text-content-muted text-xs">{t.language}</span>
                <p>{t.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
