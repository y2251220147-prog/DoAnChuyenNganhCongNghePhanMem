# ARCHITECTURE DECISION RECORD
## ADR-002: Framework Selection

### 1. BỐI CẢNH (Context)
Hệ thống cần giao diện web hiện đại và backend tách biệt theo kiến trúc Client–Server.

### 2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)
- React.js + Node.js
- Angular + Spring Boot
- ASP.NET MVC

### 3. QUYẾT ĐỊNH (Decision)
Nhóm chọn React.js cho frontend và Node.js (Express) cho backend do tính linh hoạt, phổ biến và phù hợp với kiến trúc phân tầng.

### 4. HẬU QUẢ (Consequences)
- Dễ chia module, dễ bảo trì
- Phù hợp phát triển theo Scrum
- Cần quản lý tốt bất đồng bộ

### 5. LIÊN QUAN (Related)
- Use Case Diagram
- Class Diagram
- ADR-001
