import React, { useState } from 'react';
import { useNotifications, Notification } from '../hooks/useNotifications';
import api from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const NotificationsBell: React.FC = () => {
  const { data: notes = [], isLoading } = useNotifications();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); // ✅ controls dropdown visibility

  const markMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setOpen(false); // ✅ close dropdown after marking read
    },
  });

  const unreadCount = notes.filter((n) => !n.read).length;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((prev) => !prev)}>
        🔔
        {unreadCount > 0 && <span style={{ color: 'red' }}>{unreadCount}</span>}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            background: '#001f5b', // dark blue
            color: '#fff',
            border: '1px solid #003366',
            width: 320,
          }}
        >
          {notes.map((n: Notification) => (
            <div
              key={n.id}
              style={{ padding: 8, borderBottom: '1px solid #003366' }}
            >
              <div>{n.message}</div>
              <div style={{ fontSize: 12, color: '#ccc' }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
              {!n.read && (
                <button
                  onClick={() => markMutation.mutate(n.id)}
                  disabled={markMutation.isPending}
                  style={{
                    marginTop: 4,
                    padding: '2px 6px',
                    background: '#004080',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
