import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../../pages/Dashboard';
import { renderWithProviders } from '../../test/renderWithProviders';


describe('Dashboard Integration', () => {
    it('renders dashboard with all widgets', async () => {
        renderWithProviders(<Dashboard />);

        expect(await screen.findByText('System Status')).toBeInTheDocument();
        expect(await screen.findByText('Live Activity')).toBeInTheDocument();
    });
});
