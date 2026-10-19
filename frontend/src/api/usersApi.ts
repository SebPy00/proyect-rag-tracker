import api from "./axiosInstance";
export interface ManagedUser {
  id: number;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}
export interface UserInput {
  username?: string;
  password?: string;
  is_active?: boolean;
  is_staff?: boolean;
}
export const getUsers = async () =>
  (await api.get<ManagedUser[]>("/api/users/")).data;
export const createUser = async (data: UserInput) =>
  (await api.post<ManagedUser>("/api/users/", data)).data;
export const updateUser = async (id: number, data: UserInput) =>
  (await api.patch<ManagedUser>(`/api/users/${id}/`, data)).data;
export const deleteUser = async (id: number) => api.delete(`/api/users/${id}/`);
