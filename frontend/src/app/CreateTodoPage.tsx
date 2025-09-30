import React, { useState } from 'react';
import axios from 'axios';
import api from '../lib/api';

interface User {
  id: number;
  name: string;
}

interface TodoFormProps {
  users: User[];
  onSuccess: () => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({ users, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);

  const handleToggleAssignee = (id: number) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title,
        description,
        dueDate,
        assigneeIds: selectedAssignees,
      };

      await api.post('/todos', payload);
      onSuccess();

      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedAssignees([]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || 'Error creating todo');
      } else if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Unknown error');
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border border-blue-300 p-6 rounded shadow-md w-full max-w-md"
    >
      <div>
        <label className="block font-bold underline">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded w-full p-2 mt-1"
          required
        />
      </div>

      <div>
        <label className="block font-bold underline">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded w-full p-2 mt-1"
        />
      </div>

      <div>
        <label className="block font-bold underline">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="border rounded w-full p-2 mt-1"
        />
      </div>

      <div>
        <label className="block font-bold underline">Assign To</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {users.map((user) => (
            <label key={user.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selectedAssignees.includes(user.id)}
                onChange={() => handleToggleAssignee(user.id)}
              />
              {user.name}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create Todo
      </button>
    </form>
  );
};

export const CreateTodoPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<User[]>('/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users', err);
      }
    };
    fetchUsers();
  }, []);

  const handleSuccess = () => {
    alert('Todo created successfully!');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center underline">
          Create Todo
        </h1>
        <TodoForm onSuccess={handleSuccess} users={users} />
      </div>
    </div>
  );
};

export default CreateTodoPage;
