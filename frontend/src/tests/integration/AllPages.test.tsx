import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SchedulerPage from '../../pages/SchedulerPage';
import AnalyticsPage from '../../pages/AnalyticsPage';
import AuditLogsPage from '../../pages/AuditLogsPage';
import SettingsPage from '../../pages/SettingsPage';
import FeatureFlagsPage from '../../pages/FeatureFlagsPage';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Page Rendering Integration', () => {
    it('renders Scheduler Page without crashing', () => {
        renderWithProviders(<SchedulerPage />);
        expect(screen.getByRole('heading', { name: /Content Scheduler/i })).toBeInTheDocument();
    });

    it('renders Analytics Page without crashing', async () => {
        renderWithProviders(<AnalyticsPage />);
        expect(await screen.findByRole('heading', { name: /^Analytics$/i })).toBeInTheDocument();
    });

    it('renders Audit Logs Page without crashing', async () => {
        renderWithProviders(<AuditLogsPage />);
        expect(await screen.findByRole('heading', { name: /Audit Trail/i })).toBeInTheDocument();
    });

    it('renders Settings Page without crashing', () => {
        renderWithProviders(<SettingsPage />);
        expect(screen.getByRole('heading', { name: /^Settings$/i })).toBeInTheDocument();
    });

    it('renders Feature Flags Page without crashing', () => {
        renderWithProviders(<FeatureFlagsPage />);
        expect(screen.getByRole('heading', { name: /Feature Flags/i })).toBeInTheDocument();
    });
});
