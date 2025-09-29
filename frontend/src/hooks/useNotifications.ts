import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import io from 'socket.io-client';
import { useEffect, useRef } from 'react';

export interface Notification {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get('/notifications');
  return data;
};

export const useNotifications = () => {
  const qc = useQueryClient();
  const socketRef = useRef<ReturnType<typeof io> | null>(null); // 👈 typed correctly

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety
    const token = localStorage.getItem('token');
    if (!token) return;

    const sock = io(
      (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000').replace('/api', ''),
      { auth: { token } }
    );

    socketRef.current = sock;

    sock.on('connect', () => {
      console.log('Connected to notifications socket');
    });

    sock.on('notification', (n: Notification) => {
      qc.setQueryData<Notification[]>(['notifications'], (old = []) => [n, ...old]);
    });

    return () => {
      sock.disconnect();
    };
  }, [qc]);

  return query;
};
