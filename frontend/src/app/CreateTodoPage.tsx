import React from 'react';
import { TodoForm } from '../components/TodoForm';

const mockUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  // replace with real user fetch
];

export const CreateTodoPage: React.FC = () => {
  const handleSuccess = () => {
    alert('Todo created successfully!');
  };

  return (
    <div>
      <h1>Create Todo</h1>
      <TodoForm onSuccess={handleSuccess} users={mockUsers} />
    </div>
  );
};
