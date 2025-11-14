// src/api/usersApi.ts
import axios from "./axiosInstance";

export const getUsers = async () => {
  const res = await axios.get("/api/users/");
  return res.data;   // <--- 🔥 SOLO los datos
};

export const createUser = async (user: any) => {
  const res = await axios.post("/api/users/", user);
  return res.data;
};

export const updateUser = async (id: number, user: any) => {
  const res = await axios.patch(`/api/users/${id}/`, user);
  return res.data;
};

export const deleteUser = async (id: number) => {
  const res = await axios.delete(`/api/users/${id}/`);
  return res.data;
};
