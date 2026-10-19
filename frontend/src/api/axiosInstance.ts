import axios from "axios";
import { accessExpired, readTokens, writeTokens } from "./session";

export const baseURL = import.meta.env.VITE_API_URL || "";
const api = axios.create({ baseURL, timeout: 200000 });
let refreshRequest: Promise<string> | null = null;

export function refreshAccess(): Promise<string> {
  if (!refreshRequest) {
    const tokens = readTokens();
    if (!tokens) {
      writeTokens(null);
      return Promise.reject(new Error("Sesión finalizada"));
    }
    refreshRequest = axios
      .post(
        `${baseURL}/auth/jwt/refresh/`,
        { refresh: tokens.refresh },
        { timeout: 15000 },
      )
      .then(({ data }) => {
        // Do not restore a session if the user logged out while refreshing.
        if (readTokens()?.refresh !== tokens.refresh)
          throw new Error("Sesión finalizada");
        writeTokens({
          access: data.access,
          refresh: data.refresh || tokens.refresh,
        });
        return data.access as string;
      })
      .catch((error) => {
        if (
          [400, 401].includes(error.response?.status) &&
          readTokens()?.refresh === tokens.refresh
        )
          writeTokens(null);
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

api.interceptors.request.use(async (config) => {
  const tokens = readTokens();
  if (tokens)
    config.headers.Authorization = `Bearer ${accessExpired(tokens.access) ? await refreshAccess() : tokens.access}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      readTokens()
    ) {
      config._retried = true;
      config.headers.Authorization = `Bearer ${await refreshAccess()}`;
      return api(config);
    }
    if (error.response?.status === 401) writeTokens(null);
    return Promise.reject(error);
  },
);
export default api;
