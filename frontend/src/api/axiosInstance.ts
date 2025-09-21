import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const baseURL = process.env.REACT_APP_API_URL;

interface User { exp?: number; }
interface AuthToken { access: string; refresh: string; }

const axiosInstance = axios.create({
    baseURL,
});

axiosInstance.interceptors.request.use(async req => {
    let authTokens: AuthToken | null = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')!) : null;

    if (!authTokens) {
        return req;
    }

    const user: User = jwtDecode(authTokens.access);
    const isExpired = dayjs.unix(user.exp!).diff(dayjs()) < 1;

    if (!isExpired) {
        req.headers.Authorization = `Bearer ${authTokens.access}`;
        return req;
    }

    try {
        const response = await axios.post(`${baseURL}/auth/jwt/refresh/`, {
            refresh: authTokens.refresh
        });
        localStorage.setItem('authTokens', JSON.stringify(response.data));
        req.headers.Authorization = `Bearer ${response.data.access}`;
        return req;
    } catch (error) {
        console.log("Refresh token fallido. Deslogueando.", error);
        localStorage.removeItem('authTokens');
        window.location.href = '/login';
    }

    return req;
});


axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.log("Respuesta 401 recibida. Deslogueando.");
            localStorage.removeItem('authTokens');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


export default axiosInstance;