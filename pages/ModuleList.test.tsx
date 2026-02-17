import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ModuleList from './ModuleList';
import { ModuleSummary } from '../types';

const listModules = vi.fn();
const startModule = vi.fn();

vi.mock('../services/modulesApi', () => ({
  modulesApi: {
    listModules: () => listModules(),
    startModule: (slug: string) => startModule(slug),
  },
}));

describe('ModuleList', () => {
  it('renders modules from API and shows locked state', async () => {
    const modules: ModuleSummary[] = [
      {
        id: 'm1',
        title: 'M1 Basic',
        slug: 'm1-basic',
        description: 'Intro module',
        difficulty: 'BASIC',
        status: 'PUBLISHED',
        tags: ['intro'],
        order_index: 1,
        lessons_count: 2,
        progress_percent: 25,
        is_locked: false,
      },
      {
        id: 'm2',
        title: 'M2 Locked',
        slug: 'm2-locked',
        description: 'Locked module',
        difficulty: 'INTERMEDIATE',
        status: 'PUBLISHED',
        tags: [],
        order_index: 2,
        lessons_count: 3,
        progress_percent: 0,
        is_locked: true,
        locked_reason: 'Complete previous module.',
      },
    ];

    listModules.mockResolvedValueOnce(modules);

    render(
      <MemoryRouter>
        <ModuleList />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('M1 Basic')).toBeInTheDocument();
      expect(screen.getByText('M2 Locked')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Start Module/i })).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('Complete previous module.')).toBeInTheDocument();
  });
});
