import '@testing-library/jest-dom';
import { vi } from 'vitest';

const mockClient = {
    defaults: { baseURL: 'http://localhost:8000/api/v1' },
    interceptors: {
        response: {
            use: vi.fn(),
        },
    },
    get: vi.fn(async (url: string) => {
        if (url.startsWith('/posts/posts')) return { data: [] };
        if (url.startsWith('/posts/drafts')) return { data: [] };
        if (url.startsWith('/analytics/')) return { data: [] };
        if (url.startsWith('/audit/')) return { data: [] };
        if (url.startsWith('/auth/me')) return { data: { id: 1, email: 'test@example.com', full_name: 'Test User' } };
        if (url.startsWith('/auth/google/login')) return { data: { url: 'https://example.com/oauth' } };
        if (url.startsWith('/automation/jobs/')) return { data: { status: 'PENDING' } };
        return { data: {} };
    }),
    post: vi.fn(async (url: string) => {
        if (url.startsWith('/auth/login')) {
            return {
                data: {
                    access_token: 'test-access',
                    refresh_token: 'test-refresh',
                    token_type: 'bearer',
                    user: { id: 1, email: 'test@example.com', full_name: 'Test User' },
                },
            };
        }
        if (url.startsWith('/auth/register')) return { data: { id: 1, email: 'test@example.com', full_name: 'Test User' } };
        if (url.startsWith('/posts/posts')) return { data: { id: 1 } };
        if (url.startsWith('/posts/upload')) return { data: { media_url: '/uploads/mock.png', metadata: {} } };
        if (url.startsWith('/auth/password-reset/request')) return { data: { message: 'Reset request sent.' } };
        if (url.startsWith('/auth/password-reset/confirm')) return { data: { message: 'Password updated.' } };
        return { data: {} };
    }),
    patch: vi.fn(async () => ({ data: {} })),
    delete: vi.fn(async () => ({ data: {} })),
};

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockClient),
    },
    create: vi.fn(() => mockClient),
}));

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

if (typeof globalThis.localStorage?.getItem !== 'function') {
    const store = new Map<string, string>();
    const storage = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, String(value));
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
            return store.size;
        },
    };

    vi.stubGlobal('localStorage', storage);
}

class WebSocketMock {
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(url: string) {
        void url;
        setTimeout(() => {
            this.onopen?.(new Event('open'));
        }, 0);
    }

    close() {}
    send(data: string) {
        void data;
    }
}

vi.stubGlobal('WebSocket', WebSocketMock as unknown as typeof WebSocket);
