# Development Environment Setup

Project: Website Quản lý tổ chức sự kiện nội bộ

Tech stack:

- React.js (Frontend)
- Node.js + Express (Backend)
- MySQL (Database)

---

# 1. Required Software

## Node.js

Version: 18+

Download:  
https://nodejs.org

Kiểm tra:

node -v

---

## MySQL

Version: 8+

Công cụ quản lý:

- MySQL Workbench
- DBeaver

---

## Git

Version: 2+

Kiểm tra:

git --version

---

## IDE

Visual Studio Code

Extensions:

- ESLint
- Prettier
- GitLens
- Docker

---

# 2. Project Structure

project-root  
│  
├── client  
│   ├── src  
│   ├── components  
│   ├── pages  
│  
├── server  
│   ├── controllers  
│   ├── routes  
│   ├── models  
│   ├── config  
│  
└── docs  

---

# 3. Environment Variables

File `.env.example`

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=event_management
JWT_SECRET=secret_key

Lưu ý:

- Không commit file `.env`
- Chỉ commit `.env.example`

---

# 4. Run Project

Backend

cd server
npm install
npm start

---

# 5. Database Connection

Node.js sử dụng thư viện mysql2.

Example:

```javascript
const mysql = require("mysql2")

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "event_management"
})

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err)
    return
  }
  console.log("Connected to MySQL database")
})