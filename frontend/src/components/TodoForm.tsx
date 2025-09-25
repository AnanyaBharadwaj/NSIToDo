import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Todo } from '../types';
import api from '../lib/api';

interface TodoFormInputs {
  title: string;
  description?: string;
  dueDate?: string;
  assignees: number[];
  files: FileList;
}

interface TodoFormProps {
  onSuccess: () => void;
  users: { id: number; name: string }[];
}

export const TodoForm: React.FC<TodoFormProps> = ({ onSuccess, users }) => {
  const { register, handleSubmit } = useForm<TodoFormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation<Todo, Error, TodoFormInputs>({
    mutationFn: async (data: TodoFormInputs) => {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.dueDate) formData.append('dueDate', data.dueDate);
      formData.append('assignees', JSON.stringify(data.assignees));
      Array.from(data.files).forEach((file) => formData.append('files', file));

      const response = await api.post<Todo>('/todos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] as const });
      onSuccess();
    },
  });

  const onSubmit: SubmitHandler<TodoFormInputs> = (data) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Title</label>
        <input {...register('title')} placeholder="Title" required />
      </div>
      <div>
        <label>Description</label>
        <textarea {...register('description')} placeholder="Description" />
      </div>
      <div>
        <label>Due Date</label>
        <input type="date" {...register('dueDate')} />
      </div>
      <div>
        <label>Assignees</label>
        <select multiple {...register('assignees')}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Files</label>
        <input type="file" multiple {...register('files')} />
      </div>
      <button
        type="submit"
        disabled={mutation.status === 'pending'}
      >
        {mutation.status === 'pending' ? 'Creating...' : 'Create Todo'}
      </button>
      {mutation.isError && <p style={{ color: 'red' }}>{mutation.error?.message}</p>}
    </form>
  );
};
