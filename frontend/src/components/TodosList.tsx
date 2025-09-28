import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Todo } from '../types';
import api from '../lib/api';

interface TodosListProps {
  filter: 'myTodos' | 'assignedTodos';
}

export const TodosList: React.FC<TodosListProps> = ({ filter }) => {
  const { data, isLoading, error, refetch } = useQuery<Todo[], Error>({
    queryKey: ['todos', filter],
    queryFn: async () => {
      // Call correct endpoint based on filter
      if (filter === 'myTodos') {
        const response = await api.get<Todo[]>('/todos/my');
        console.log('Fetched my todos:', response.data); // debug
        return response.data;
      } else {
        const response = await api.get<Todo[]>('/todos/assigned');
        console.log('Fetched assigned todos:', response.data); // debug
        return response.data;
      }
    },
    staleTime: 0, // never consider cache fresh
    refetchOnWindowFocus: true, // always fetch when window is focused
  });

  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  const handleToggle = (id: number) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const todos: Todo[] = data ?? [];

  return (
    <div className="space-y-3">
      {todos.length === 0 && <p className="text-gray-500">No todos yet.</p>}

      {todos.map(todo => (
        <div
          key={todo.id}
          className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">{todo.title}</h3>
            <input
              type="checkbox"
              checked={checkedIds.includes(todo.id)}
              onChange={() => handleToggle(todo.id)}
            />
          </div>

          {todo.description && (
            <p className="text-gray-700 text-sm">{todo.description}</p>
          )}

          {todo.dueDate && (
            <p className="text-gray-500 text-xs">
              Due: {new Date(todo.dueDate).toLocaleDateString()}
            </p>
          )}

          {todo.files?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {todo.files.map(file => (
                <a
                  key={file.id}
                  href={`/api/files/${file.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  {file.filename}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TodosList;
