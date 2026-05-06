# 06. Hướng dẫn triển khai (Deployment Guide)

Hệ thống EventPro được thiết kế để dễ dàng triển khai dưới dạng kiến trúc Client-Server.

## 1. Triển khai Frontend (React/Vite)
- **Lệnh đóng gói**: `npm run build` (Kết quả nằm trong thư mục `dist/`).
- **Nền tảng khuyến nghị**: Vercel hoặc Netlify (Hỗ trợ cấu hình SPA Fallback).

## 2. Triển khai Backend (NodeJS/Express)
- **Chuẩn bị**: Cấu hình các biến môi trường thực tế trên server (Production Config).
- **Công cụ chạy**: Sử dụng **PM2** để quản lý tiến trình và tự động restart khi lỗi.
- **Lệnh chạy**: `pm2 start server.js --name "eventpro-api"`

## 3. Cơ sở dữ liệu (MySQL)
- Đảm bảo Remote Access hoặc sử dụng các dịch vụ DB as a Service (như PlanetScale hoặc RDS).
Hosting tĩnh.
