import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function VolunteerScript() {
  const [question, setQuestion] = useState('');
  const script = useMutation({
    mutationFn: () => api.volunteerScript(question, 'English'),
  });

  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">
        Volunteer Script Assistant
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) script.mutate();
        }}
        className="flex gap-2"
      >
        <label htmlFor="volunteer-q" className="sr-only">
          Fan question
        </label>
        <input
          id="volunteer-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="A fan asks…"
          className="flex-1 rounded-sm bg-surface-2 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={script.isPending || !question.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {script.isPending ? 'Drafting…' : 'Draft script'}
        </button>
      </form>

      <div aria-live="polite" className="mt-3">
        {script.isError && (
          <p className="text-status-crit text-sm" role="alert">
            {(script.error as Error).message}
          </p>
        )}
        {script.data && (
          <blockquote className="border-l-2 border-primary pl-3 text-sm">
            {script.data.script}
          </blockquote>
        )}
      </div>
    </div>
  );
}
