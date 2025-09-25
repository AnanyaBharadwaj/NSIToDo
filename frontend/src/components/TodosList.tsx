import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Todo } from '../types';
import api from '../lib/api';

interface TodosListProps {
  filter: 'myTodos' | 'assignedTodos';
}

export const TodosList: React.FC<TodosListProps> = ({ filter }) => {
  const { data, isLoading, error } = useQuery<Todo[], Error>({
    queryKey: ['todos', filter],
    queryFn: async () => {
      const response = await api.get<Todo[]>('/todos', { params: { filter } });
      return response.data;
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const todos: Todo[] = data ?? [];

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.title} —{' '}
          {todo.files?.[0] && (
            <a
              href={`/api/files/${todo.files[0].id}/download`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download File
            </a>
          )}
        </li>
      ))}
    </ul>
  );
};

export default TodosList;
