const ExcelJS = require('exceljs');
const path = require('path');

async function createExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Phan Cong');

    // Add main title
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BẢNG PHÂN CÔNG CÔNG VIỆC NHÓM';
    titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF1C4587' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    sheet.addRow([]);

    // Info rows
    sheet.getCell('A3').value = 'Tên dự án:';
    sheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    sheet.getCell('A3').font = { bold: true };
    sheet.mergeCells('B3:E3');
    sheet.getCell('B3').value = 'Đồ án Chuyên ngành Công nghệ Phần mềm';
    sheet.getCell('F3').value = 'Sprint:';
    sheet.getCell('F3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    sheet.getCell('F3').font = { bold: true };
    sheet.mergeCells('G3:J3');
    sheet.getCell('G3').value = '02';

    sheet.getCell('A4').value = 'Ngày bắt đầu:';
    sheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    sheet.getCell('A4').font = { bold: true };
    sheet.mergeCells('B4:E4');
    sheet.getCell('B4').value = '01/02/2026';
    sheet.getCell('F4').value = 'Trưởng nhóm:';
    sheet.getCell('F4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    sheet.getCell('F4').font = { bold: true };
    sheet.mergeCells('G4:J4');
    sheet.getCell('G4').value = '[Tên trưởng nhóm]';

    sheet.addRow([]);

    // Headers
    const headers = ['#', 'Công việc / User Story', 'Mô tả chi tiết', 'Người thực hiện', 'Ưu tiên', 'Story Points', 'Ngày bắt đầu', 'Hạn hoàn thành', 'Trạng thái', 'Ghi chú'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C4587' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Column widths
    sheet.columns = [
        { width: 5 },
        { width: 25 },
        { width: 35 },
        { width: 15 },
        { width: 10 },
        { width: 12 },
        { width: 12 },
        { width: 15 },
        { width: 12 },
        { width: 15 }
    ];

    // Data
    const data = [
        [1, '[US-005] Tạo sự kiện mới', 'Giao diện form và xử lý API tạo sự kiện', 'Thành viên 1', 'Cao', 8, '01/02', '02/02', 'Hoàn thành', ''],
        [2, '[US-008] Xem danh sách sự kiện', 'Trang hiển thị list sự kiện, phân trang', 'Thành viên 2', 'Cao', 5, '01/02', '02/02', 'Hoàn thành', ''],
        [3, '[US-022] Chi tiết sự kiện', 'Trang hiển thị nội dung chi tiết và bản đồ', 'Thành viên 3', 'Cao', 5, '01/02', '02/02', 'Hoàn thành', ''],
        [4, '[US-006] Chỉnh sửa sự kiện', 'Cho phép cập nhật thông tin sự kiện đã tạo', 'Thành viên 1', 'Trung bình', 5, '02/02', '02/02', 'Hoàn thành', ''],
        [5, '[US-023] Tìm kiếm sự kiện', 'Input tìm theo tên, mô tả', 'Thành viên 2', 'Trung bình', 3, '02/02', '02/02', 'Hoàn thành', ''],
        [6, '[US-007] Xóa sự kiện', 'Tính năng Soft delete cho sự kiện', 'Thành viên 3', 'Thấp', 3, '02/02', '02/02', 'Hoàn thành', '']
    ];

    data.forEach((rowData) => {
        const row = sheet.addRow(rowData);
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EFDF' } };
    });

    // Empty rows
    for (let i = 7; i <= 10; i++) {
        sheet.addRow([i, '', '', '', '', '', '', '', '', '']).eachCell(c => c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } });
    }

    sheet.addRow([]);

    // Stats
    sheet.mergeCells('A18:J18');
    const statsHeader = sheet.getCell('A18');
    statsHeader.value = 'THỐNG KÊ NHANH';
    statsHeader.font = { color: { argb: 'FFD35400' }, bold: true, size: 12 };

    const r19 = sheet.addRow(['Tổng số công việc:', '', 6, 'Đã hoàn thành:', '', 6, 'Chờ review:', '', 0, '']);
    sheet.mergeCells(`A${r19.number}:B${r19.number}`);
    sheet.mergeCells(`D${r19.number}:E${r19.number}`);
    sheet.mergeCells(`G${r19.number}:H${r19.number}`);
    r19.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    r19.getCell(1).font = { bold: true };
    r19.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    r19.getCell(4).font = { bold: true };
    r19.getCell(7).font = { bold: true };

    const r20 = sheet.addRow(['Tổng Story Points:', '', 29, 'Đang thực hiện:', '', 0, 'Bị chặn:', '', 0, '']);
    sheet.mergeCells(`A${r20.number}:B${r20.number}`);
    sheet.mergeCells(`D${r20.number}:E${r20.number}`);
    sheet.mergeCells(`G${r20.number}:H${r20.number}`);
    r20.getCell(1).font = { bold: true };
    r20.getCell(4).font = { bold: true };
    r20.getCell(7).font = { bold: true };

    const r21 = sheet.addRow(['Ưu tiên cao:', '', 3, '', '', '', 'Tỷ lệ hoàn thành:', '', '100%', '']);
    sheet.mergeCells(`A${r21.number}:B${r21.number}`);
    sheet.mergeCells(`D${r21.number}:E${r21.number}`);
    sheet.mergeCells(`G${r21.number}:H${r21.number}`);
    r21.getCell(1).font = { bold: true };
    r21.getCell(7).font = { bold: true };

    const outputPath = path.join(__dirname, 'docs', 'BT_Tuan06', 'BM06_Phan_cong_Sprint_2.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log('Excel file created successfully at ' + outputPath);
}

createExcel().catch(console.error);
