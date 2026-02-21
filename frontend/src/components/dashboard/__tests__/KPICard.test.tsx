import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KPICard from '../KPICard';
import { Activity } from 'lucide-react';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('KPICard', () => {
    it('renders title and value correctly', () => {
        renderWithProviders(
            <KPICard
                title="Test Metric"
                value="1,234"
                trend="5%"
                trendUp={true}
                icon={Activity}
                color="blue"
            />
        );

        expect(screen.getByText('Test Metric')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
        expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it('renders trend indicator correctly', () => {
        renderWithProviders(
            <KPICard
                title="Test Metric"
                value="100"
                trend="10%"
                trendUp={false}
                icon={Activity}
                color="orange"
            />
        );

        const trendElement = screen.getByText(/10%/);
        expect(trendElement.parentElement).toHaveClass('text-red-600');
    });
});
