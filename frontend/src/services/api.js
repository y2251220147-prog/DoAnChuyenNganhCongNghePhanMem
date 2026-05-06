import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // [CHỐNG CACHE TOÀN CỤC]: Ép trình duyệt luôn tải dữ liệu mới nhất từ Server cho TẤT CẢ các API GET
    if (config.method === 'get') {
        config.params = {
            ...config.params,
            _t: Date.now() // Thêm timestamp ngẫu nhiên
        };
        // Thêm các headers chống cache chuẩn HTTP
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
    }

    return config;

});

// Response interceptor: Xử lý lỗi 401 Unauthorized (Token hết hạn/không hợp lệ)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;