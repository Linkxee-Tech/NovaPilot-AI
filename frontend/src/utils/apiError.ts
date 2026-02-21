export function normalizeApiErrorMessage(
    detail: unknown,
    fallback: string = 'An unexpected error occurred'
): string {
    if (typeof detail === 'string' && detail.trim()) {
        return detail;
    }

    if (Array.isArray(detail)) {
        const messages = detail
            .map((item) => {
                if (typeof item === 'string') {
                    return item;
                }
                if (item && typeof item === 'object' && 'msg' in item) {
                    const msg = (item as { msg?: unknown }).msg;
                    if (typeof msg === 'string' && msg.trim()) {
                        return msg;
                    }
                }
                return '';
            })
            .filter(Boolean);

        if (messages.length > 0) {
            return messages.join('; ');
        }
    }

    if (detail && typeof detail === 'object') {
        const candidate = (detail as { message?: unknown; detail?: unknown; msg?: unknown });
        for (const value of [candidate.message, candidate.detail, candidate.msg]) {
            if (typeof value === 'string' && value.trim()) {
                return value;
            }
        }
    }

    return fallback;
}

