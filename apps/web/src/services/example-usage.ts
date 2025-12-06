// مثال على استخدام الـ HTTP Client في service files

import { httpClient } from './httpclient';

// ============================================
// 1. مثال: Auth Service
// ============================================
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authService = {
  // Login
  login: async (data: LoginDto) => {
    return httpClient.post<LoginResponse>('/auth/login', data);
  },

  // Logout
  logout: async () => {
    return httpClient.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: async () => {
    return httpClient.get<LoginResponse['user']>('/auth/me');
  },
};

// ============================================
// 2. مثال: Users Service
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  isActive?: boolean;
}

export const usersService = {
  // Get all users
  getAll: async () => {
    return httpClient.get<User[]>('/users');
  },

  // Get user by ID
  getById: async (id: string) => {
    return httpClient.get<User>(`/users/${id}`);
  },

  // Create new user
  create: async (data: CreateUserDto) => {
    return httpClient.post<User>('/users', data);
  },

  // Update user
  update: async (id: string, data: UpdateUserDto) => {
    return httpClient.patch<User>(`/users/${id}`, data);
  },

  // Delete user
  delete: async (id: string) => {
    return httpClient.delete(`/users/${id}`);
  },
};

// ============================================
// 3. مثال: File Upload Service
// ============================================
export const filesService = {
  // Upload single file
  uploadFile: async (
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.upload<{ url: string; filename: string }>(
      '/files/upload',
      formData,
      (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(progress);
        }
      }
    );
  },

  // Download file
  downloadFile: async (fileId: string, filename: string) => {
    return httpClient.download(`/files/${fileId}/download`, filename);
  },
};

// ============================================
// 4. مثال: استخدام مع React Query
// ============================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query hook للحصول على كل المستخدمين
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });
};

// Query hook للحصول على مستخدم واحد
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getById(id),
    enabled: !!id, // فقط لو في id
  });
};

// Mutation hook لإنشاء مستخدم جديد
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.create(data),
    onSuccess: () => {
      // Invalidate وrefresh الـ users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Mutation hook لتحديث مستخدم
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate الـ user المحدد والـ list
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Mutation hook للحذف
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ============================================
// 5. مثال: استخدام في Component
// ============================================
/*
import { useUsers, useCreateUser } from './services/example-usage';
import { toast } from 'sonner';

function UsersComponent() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  const handleCreate = async (data: CreateUserDto) => {
    try {
      await createUser.mutateAsync(data);
      toast.success('User created successfully!');
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
*/
