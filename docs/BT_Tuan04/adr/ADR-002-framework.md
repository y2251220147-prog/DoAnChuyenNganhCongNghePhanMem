# ADR-002: Framework Selection

## Status
Accepted

## Context

Dự án cần xây dựng một hệ thống web quản lý tổ chức sự kiện nội bộ.

Yêu cầu:

- frontend hiện đại
- backend xử lý API
- dễ phát triển theo nhóm
- phù hợp với kiến trúc REST API

---

## Decision

Nhóm quyết định sử dụng:

Frontend:
React.js

Backend:
Node.js với Express.js

Database:
MySQL

---

## Architecture

Hệ thống được xây dựng theo kiến trúc:

Frontend (React.js)
|
REST API
|
Backend (Node.js + Express)
|
MySQL Database

---

## Consequences

### Ưu điểm

React.js

- component based
- dễ tái sử dụng
- cộng đồng lớn

Node.js

- xử lý bất đồng bộ tốt
- phù hợp cho REST API
- dễ tích hợp với frontend

MySQL

- cơ sở dữ liệu quan hệ ổn định

---

### Nhược điểm

- cần quản lý nhiều package
- cần thiết lập môi trường development rõ ràng

---

## Alternatives Considered

Vue.js

- nhẹ
- nhưng nhóm quen React hơn

Django

- mạnh
- nhưng không đồng bộ với frontend React