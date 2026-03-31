const nodemailer = require("nodemailer");

/**
 * Tạo transporter gửi email (dùng Gmail OAuth2 hoặc App Password).
 * Cấu hình qua biến môi trường:
 *   MAIL_USER  — địa chỉ Gmail dùng làm sender (vd: eventpro@gmail.com)
 *   MAIL_PASS  — App Password của Gmail (16 ký tự, tạo tại myaccount.google.com)
 *   MAIL_FROM  — Tên hiển thị (mặc định: "EventPro System")
 */
const createTransporter = () =>
    nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.MAIL_USER,
            // App Password có thể có khoảng trắng giữa các nhóm 4 ký tự → trim hết
            pass: (process.env.MAIL_PASS || "").replace(/\s/g, ""),
        },
    });

/**
 * Gửi email mời tham dự sự kiện cho khách mời bên ngoài.
 * @param {{ name, email, qr_code, event: { name, start_date, end_date, location, venue_type, description } }} param
 */
exports.sendGuestInvitation = async ({ name, email, qr_code, event }) => {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn("⚠️  MAIL_USER / MAIL_PASS chưa được cấu hình → bỏ qua gửi email mời.");
        return;
    }

    const transporter = createTransporter();

    // Kiểm tra kết nối SMTP trước khi gửi
    try {
        await transporter.verify();
    } catch (verifyErr) {
        console.error("❌ Gmail SMTP xác thực thất bại:", verifyErr.message);
        console.error("   MAIL_USER:", process.env.MAIL_USER);
        console.error("   Đảm bảo đã bật 2-Step Verification và dùng App Password.");
        throw verifyErr;
    }

    const from = process.env.MAIL_FROM || "EventPro System";

    const fmtDT = (d) =>
        d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" }) : "—";
    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
    const fmtTime = (d) =>
        d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

    // Link tra cứu mã QR qua Guest Portal
    const portalLink = `${process.env.APP_URL || "http://localhost:5173"}/guest-portal`;

    // URL ảnh QR (dùng service bên ngoài để nhúng vào email)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr_code)}&margin=10`;

    const eventVenueLabel =
        event.venue_type === "online" ? "🌐 Online (link sẽ được gửi trước ngày diễn ra)" : `📍 ${event.location || "Xem thêm thông tin từ ban tổ chức"}`;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Thư mời tham dự sự kiện</title>
</head>
<body style="margin:0;padding:0;background:#F4F6FB;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FB;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#4F46E5,#6D28D9);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="background:rgba(255,255,255,0.15);display:inline-block;padding:10px 18px;border-radius:10px;margin-bottom:16px;">
              <span style="font-size:28px;">🎪</span>
            </div>
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.3px;">Thư Mời Tham Dự Sự Kiện</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">EventPro Management System</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#fff;padding:36px 40px;">
            <!-- Lời chào -->
            <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">Xin chào, <strong>${name}</strong> 👋</p>
            <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
              Ban tổ chức trân trọng kính mời bạn tham dự sự kiện dưới đây. Vui lòng mang theo thư mời này (hoặc ảnh chụp) để check-in tại sự kiện.
            </p>

            <!-- Thông tin sự kiện -->
            <div style="background:#F8FAFF;border:1.5px solid #E0E7FF;border-radius:12px;padding:24px;margin-bottom:24px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#4F46E5;">🎪 ${event.name}</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:7px 0;border-bottom:1px solid #E8EAF6;width:110px;">
                    <span style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;">Ngày bắt đầu</span>
                  </td>
                  <td style="padding:7px 0;border-bottom:1px solid #E8EAF6;">
                    <span style="font-size:14px;color:#1e293b;font-weight:600;">📅 ${fmtDT(event.start_date)}</span>
                  </td>
                </tr>
                ${event.end_date ? `
                <tr>
                  <td style="padding:7px 0;border-bottom:1px solid #E8EAF6;">
                    <span style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;">Kết thúc</span>
                  </td>
                  <td style="padding:7px 0;border-bottom:1px solid #E8EAF6;">
                    <span style="font-size:14px;color:#1e293b;">🏁 ${fmtDT(event.end_date)}</span>
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="padding:7px 0;border-bottom:1px solid #E8EAF6;">
                    <span style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;">Địa điểm</span>
                  </td>
                  <td style="padding:7px 0;border-bottom:1px solid #E8EAF6;">
                    <span style="font-size:14px;color:#1e293b;">${eventVenueLabel}</span>
                  </td>
                </tr>
                ${event.event_type ? `
                <tr>
                  <td style="padding:7px 0;">
                    <span style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;">Loại sự kiện</span>
                  </td>
                  <td style="padding:7px 0;">
                    <span style="font-size:14px;color:#4F46E5;font-weight:600;">🏷️ ${event.event_type}</span>
                  </td>
                </tr>` : ""}
              </table>
              ${event.description ? `
              <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E8EAF6;">
                <p style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;">Mô tả</p>
                <p style="font-size:13px;color:#475569;margin:0;line-height:1.6;">${event.description}</p>
              </div>` : ""}
            </div>

            <!-- Mã QR -->
            <div style="text-align:center;margin-bottom:24px;">
              <p style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 12px;">📱 Mã QR Check-in của bạn</p>
              <div style="display:inline-block;background:#fff;padding:16px;border:2px solid #E0E7FF;border-radius:16px;box-shadow:0 4px 16px rgba(79,70,229,0.1);">
                <img src="${qrImageUrl}" width="200" height="200" alt="QR Code" style="display:block;border-radius:8px;"/>
              </div>
              <p style="font-size:11px;color:#94A3B8;margin:10px 0 0;font-family:monospace;word-break:break-all;">${qr_code}</p>
              <p style="font-size:12px;color:#64748b;margin:8px 0 0;">
                ⚠️ Mã QR này chỉ dùng cho <strong>${event.name}</strong> và duy nhất cho bạn — không chia sẻ với người khác.
              </p>
            </div>

            <!-- Nút tra cứu -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${portalLink}" target="_blank"
                style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                🎫 Xem vé của tôi
              </a>
              <p style="font-size:12px;color:#94A3B8;margin:10px 0 0;">
                Hoặc truy cập: <a href="${portalLink}" style="color:#4F46E5;">${portalLink}</a><br/>
                Nhập email <strong>${email}</strong> để tra cứu vé bất kỳ lúc nào.
              </p>
            </div>

            <!-- Lưu ý -->
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:16px;font-size:13px;color:#92400E;line-height:1.6;">
              <strong>📌 Lưu ý quan trọng:</strong><br/>
              • Vui lòng đến đúng giờ và mang theo phiếu mời này.<br/>
              • Mã QR sẽ được quét để xác nhận danh tính tại cửa vào.<br/>
              • Nếu có thắc mắc, vui lòng liên hệ ban tổ chức.
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#F1F5F9;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="font-size:12px;color:#94A3B8;margin:0;">
              © EventPro Management System — Hệ thống quản lý sự kiện nội bộ<br/>
              Email này được gửi tự động, vui lòng không trả lời trực tiếp.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const mailOptions = {
        from: `"${from}" <${process.env.MAIL_USER}>`,
        replyTo: process.env.MAIL_USER,
        to: email,
        subject: `[Thư mời] ${event.name} - EventPro`,
        html,
        // Phiên bản text thuần (fallback cho email client cũ)
        text: [
            `Xin chào ${name},`,
            ``,
            `Bạn được mời tham dự sự kiện: ${event.name}`,
            `📅 Thời gian: ${fmtDT(event.start_date)}${event.end_date ? ` → ${fmtDT(event.end_date)}` : ""}`,
            `📍 Địa điểm: ${event.venue_type === "online" ? "Online" : event.location || "Liên hệ ban tổ chức"}`,
            ``,
            `Mã QR của bạn: ${qr_code}`,
            ``,
            `Tra cứu vé tại: ${portalLink} (nhập email ${email})`,
            ``,
            `Trân trọng,`,
            `Ban tổ chức — EventPro`,
        ].join("\n"),
        // Header chống spam
        headers: {
            "X-Priority": "1",
            "X-Mailer": "EventPro System",
            "Importance": "high",
        },
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email mời cho ${email} — sự kiện: ${event.name}`);
};
