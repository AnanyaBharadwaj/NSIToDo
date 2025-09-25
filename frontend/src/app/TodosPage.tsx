import React, { useState } from 'react';
import { TodosList } from '../components/TodosList';

export const TodosPage: React.FC = () => {
  const [filter, setFilter] = useState<'myTodos' | 'assignedTodos'>('myTodos');

  return (
    <div>
      <h1>Todos</h1>
      <div>
        <button onClick={() => setFilter('myTodos')}>My Todos</button>
        <button onClick={() => setFilter('assignedTodos')}>Assigned Todos</button>
      </div>
      <TodosList filter={filter} />
    </div>
  );
};
