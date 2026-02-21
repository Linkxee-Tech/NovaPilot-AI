import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';

export const renderWithProviders = (ui: ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <BrowserRouter>{ui}</BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
};
