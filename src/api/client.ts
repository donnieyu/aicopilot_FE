import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

// 기본 Axios 인스턴스 설정
export const client = axios.create({
    baseURL: baseURL + "/api",
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,
});

// 응답 인터셉터 (에러 핸들링 용이성)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);