import axios from 'axios';

// 기본 Axios 인스턴스 설정
export const client = axios.create({
    baseURL: '/api', // Vite Proxy를 타게 됩니다.
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // [Change] 기본 타임아웃을 10초 -> 60초로 증가
});

// 응답 인터셉터 (에러 핸들링 용이성)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);