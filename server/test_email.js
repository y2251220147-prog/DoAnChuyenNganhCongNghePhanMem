require("dotenv").config();
const { sendGuestInvitation } = require("./services/emailService");

sendGuestInvitation({
    name: "Test Guest",
    email: "duc_2251220120@dau.edu.vn",
    qr_code: "EP-99-TEST-ABCD1234-EFGH5678-AABBCCDD",
    event: {
        name: "Su Kien Test EmailService",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 3 * 3600000).toISOString(),
        location: "Phong A101 - Dai hoc DAU",
        venue_type: "offline",
        event_type: "seminar",
        description: "Day la email test tu he thong EventPro - emailService.js moi"
    }
}).then(() => console.log("✅ EMAIL SENT OK")).catch(e => console.error("❌ FAILED:", e.message));
