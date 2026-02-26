import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import KPICard from '../../components/dashboard/KPICard';
import StatusWidget from '../../components/dashboard/StatusWidget';
import CalendarView from '../../components/scheduler/CalendarView';
import PerformanceChart from '../../components/analytics/PerformanceChart';
import { Activity } from 'lucide-react';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Experiment', () => {
    it('renders KPICard', () => {
        renderWithProviders(<KPICard title="Test Metric" value="100" icon={Activity} />);
        expect(screen.getByText('Test Metric')).toBeInTheDocument();
    });

    it('renders StatusWidget', () => {
        renderWithProviders(<StatusWidget />);
        expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    it('renders CalendarView', async () => {
        renderWithProviders(<CalendarView onDateSelect={() => { }} onPostSelect={() => { }} />);
        expect(await screen.findByText(/^Sun$/)).toBeInTheDocument();
    });

    it('renders PerformanceChart', () => {
        const mockData = [{ name: 'Test', clicks: 10, impressions: 20 }];
        renderWithProviders(<PerformanceChart data={mockData} />);
        expect(screen.getByText(/Signal Propagation/)).toBeInTheDocument();
    });
});
