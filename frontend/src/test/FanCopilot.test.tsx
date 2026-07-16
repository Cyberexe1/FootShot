import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import FanCopilot from '../features/copilot/FanCopilot';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: { chat: vi.fn() },
}));

function renderCopilot() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FanCopilot />
    </QueryClientProvider>,
  );
}

describe('FanCopilot', () => {
  it('sends a question and shows the grounded answer with sources', async () => {
    vi.mocked(api.chat).mockResolvedValue({
      answer: 'Gate C has step-free access.',
      sources: [{ id: 'accessibility', title: 'Accessibility' }],
      language: 'English',
    });

    const user = userEvent.setup();
    renderCopilot();

    await user.type(
      screen.getByLabelText(/ask the fan copilot/i),
      'where is the step-free entrance',
    );
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/step-free access/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Sources: Accessibility/i)).toBeInTheDocument();
  });

  it('passes the selected language to the API', async () => {
    vi.mocked(api.chat).mockResolvedValue({
      answer: 'Hola',
      sources: [],
      language: 'Spanish',
    });

    const user = userEvent.setup();
    renderCopilot();

    await user.selectOptions(screen.getByLabelText(/response language/i), 'Spanish');
    await user.type(screen.getByLabelText(/ask the fan copilot/i), 'hola');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(api.chat).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'Spanish' }),
      ),
    );
  });
});
