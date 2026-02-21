import { useState, useEffect, useRef } from 'react';

interface StatusUpdatePayload {
    id: number;
    action: string;
    status: 'OK' | 'ERROR' | 'WARNING';
    timestamp: string;
    trace_id?: string;
}

type StatusUpdate = {
    type: 'STATUS' | 'LOG' | 'ACTIVITY';
    payload: StatusUpdatePayload;
};

export const useSocket = (path: string = '/automation/ws/logs') => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<StatusUpdate | null>(null);
    const [activities, setActivities] = useState<StatusUpdatePayload[]>([]);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000/api/v1';
        const url = `${baseUrl}${path}`;

        const connect = () => {
            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                setIsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const payload: StatusUpdatePayload = {
                        id: Date.now(),
                        action: data.message,
                        status: data.level === 'ERROR' ? 'ERROR' : 'OK',
                        timestamp: data.timestamp,
                        trace_id: data.trace_id
                    };
                    setLastMessage({
                        type: 'ACTIVITY',
                        payload
                    });
                    setActivities((prev) => [payload, ...prev].slice(0, 10));
                } catch {
                    // Silently fail on parse error in production
                }
            };

            socket.onclose = () => {
                setIsConnected(false);
                setTimeout(connect, 5000);
            };

            socket.onerror = () => {
                socket.close();
            };
        };

        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [path]);

    return { isConnected, lastMessage, activities };
};
