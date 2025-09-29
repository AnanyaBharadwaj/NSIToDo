// frontend/components/NotificationsBell.tsx
import React from 'react';
import { useNotifications, Notification } from '../hooks/useNotifications';
import api from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const NotificationsBell: React.FC = () => {
  const { data: notes = [], isLoading } = useNotifications();
  const qc = useQueryClient();

  const markMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notes.filter((n) => !n.read).length;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <button>
        🔔
        {unreadCount > 0 && <span style={{ color: 'red' }}>{unreadCount}</span>}
      </button>

      <div
        style={{
          position: 'absolute',
          right: 0,
          background: '#fff',
          border: '1px solid #ddd',
          width: 320,
        }}
      >
        {notes.map((n: Notification) => (
          <div
            key={n.id}
            style={{ padding: 8, borderBottom: '1px solid #eee' }}
          >
            <div>{n.message}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {new Date(n.createdAt).toLocaleString()}
            </div>
            {!n.read && (
              <button
                onClick={() => markMutation.mutate(n.id)}
                disabled={markMutation.isPending} // ✅ v5 mutation pending
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
