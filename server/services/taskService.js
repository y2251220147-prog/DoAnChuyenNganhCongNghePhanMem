const Task = require("../models/taskModel");
const Event = require("../models/eventModel");
const Attendee = require("../models/attendeeModel");
const Staff = require("../models/staffModel");
const Notification = require("../models/notificationModel");
const db = require("../config/database");

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABEL = {
    todo: 'Chuẩn bị',
    in_progress: 'Đang làm',
    done: 'Hoàn thành'
};

// Nếu user X đã đăng ký tham gia sự kiện đó → không được gán task
const checkAttendeeConflict = async (eventId, userId) => {
    if (!userId) return;
    const att = await Attendee.findByUserAndEvent(userId, eventId);
    if (att) {
        throw {
            status: 400,
            message: "Nhân viên đã đăng ký tham gia sự kiện không thể được gán công việc"
        };
    }
};

// Đảm bảo user có trong event_staff (nhân sự tổ chức)
const ensureEventStaff = async (eventId, userId) => {
    if (!userId) return;
    
    // 1. Kiểm tra xem user này có đang là "người tham gia" (attendee) không
    const att = await Attendee.findByUserAndEvent(userId, eventId);
    if (att) {
        // Nếu đã là người tham gia thì không tự động thêm vào ban tổ chức
        return;
    }

    // 2. Nếu chưa là nhân sự tổ chức thì mới thêm
    const existing = await Staff.findByEventAndUser(eventId, userId);
    if (!existing) {
        await Staff.assign({ event_id: eventId, user_id: userId, role: 'support' });
    }
};



// ── Tasks ─────────────────────────────────────────────────────
exports.getByEvent = async (eid) => await Task.getByEvent(eid);
exports.getById = async (id) => {
    const t = await Task.getById(id);
    if (!t) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    return t;
};
exports.getEventStats = async (eid) => await Task.getEventStats(eid);
exports.getMyTasks = async (userId) => await Task.getMyTasks(userId);

exports.create = async (data, creatorId) => {
    if (!data.event_id || !data.title)
        throw { status: 400, message: "event_id và title là bắt buộc" };
    if (!data.due_date)
        throw { status: 400, message: "Deadline (due_date) là bắt buộc khi tạo nhiệm vụ" };

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Kiểm tra attendee conflict và đảm bảo là staff
        if (data.assigned_to) {
            await checkAttendeeConflict(data.event_id, data.assigned_to);
            await ensureEventStaff(data.event_id, data.assigned_to);
        }

        // Tạo nhiệm vụ
        const [taskResult] = await conn.query(`
            INSERT INTO event_tasks
              (event_id,phase_id,parent_id,title,description,assigned_to,assigned_department_id,
               supporters,status,priority,due_date,start_date,is_milestone,position,progress,
               estimated_h,estimated_budget,actual_budget,created_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
            data.event_id, data.phase_id || null, data.parent_id || null,
            data.title, data.description || null,
            data.assigned_to || null, data.assigned_department_id || null,
            data.supporters ? JSON.stringify(data.supporters) : null,
            data.status || 'todo', data.priority || 'medium',
            data.due_date, data.start_date || null,
            data.is_milestone ? 1 : 0, data.position || 0, data.progress || 0,
            data.estimated_h || null, data.estimated_budget || 0, data.actual_budget || 0, creatorId || null
        ]);

        const id = taskResult.insertId;

        // Ghi lịch sử
        await conn.query(
            "INSERT INTO task_history (task_id,user_id,action,new_value) VALUES (?,?,?,?)",
            [id, creatorId, 'created', data.title]
        );

        await conn.commit();

        // Thông báo (ngoài transaction)
        if (data.assigned_to && String(data.assigned_to) !== String(creatorId)) {
            await Notification.create({
                user_id: data.assigned_to,
                type: 'task_assigned',
                title: 'Bạn được giao nhiệm vụ mới',
                message: `"${data.title}"`,
                link: `/events/${data.event_id}?tab=tasks`
            });
        }

        try {
            const event = await Event.getById(data.event_id);
            if (event && event.owner_id && String(event.owner_id) !== String(creatorId)) {
                await Notification.create({
                    user_id: event.owner_id,
                    type: 'task_assigned',
                    title: 'Nhiệm vụ mới trong sự kiện',
                    message: `Một nhiệm vụ mới "${data.title}" vừa được tạo trong sự kiện của bạn.`,
                    link: `/events/${data.event_id}?tab=tasks`
                });
            }
        } catch (e) { console.error("Lỗi thông báo Organizer (task create):", e); }

        return { id };
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            throw { status: 500, message: "Lỗi hệ thống: Phiên đăng nhập của bạn không hợp lệ (User ID không tồn tại). Vui lòng đăng xuất và đăng nhập lại." };
        }
        throw error;
    } finally {
        conn.release();
    }
};

exports.update = async (id, data, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const changes = [];

        // Status change
        if (data.status && data.status !== task.status) {
            if (!VALID_STATUSES.includes(data.status))
                throw { status: 400, message: "Trạng thái không hợp lệ" };
            changes.push({ action: 'status_change', old_value: STATUS_LABEL[task.status], new_value: STATUS_LABEL[data.status] });
            
            await conn.query(
                "INSERT INTO task_comments (task_id,user_id,content,type) VALUES (?,?,?,?)",
                [id, userId, `Chuyển trạng thái: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[data.status]}`, 'status_change']
            );
        }

        // Assign change
        if (data.assigned_to && String(data.assigned_to) !== String(task.assigned_to)) {
            await checkAttendeeConflict(task.event_id, data.assigned_to);
            await ensureEventStaff(task.event_id, data.assigned_to);
            changes.push({ action: 'assign', old_value: task.assigned_name || '', new_value: data.assigned_to });
        }

        // Deadline change
        if (data.due_date && data.due_date !== task.due_date) {
            changes.push({ action: 'due_date', old_value: task.due_date, new_value: data.due_date });
        }

        // Thực hiện update
        await conn.query(`
            UPDATE event_tasks SET
              phase_id=?,parent_id=?,title=?,description=?,assigned_to=?,assigned_department_id=?,
              supporters=?,status=?,priority=?,due_date=?,start_date=?,is_milestone=?,position=?,
              progress=?,estimated_h=?,actual_h=?,estimated_budget=?,actual_budget=?,feedback_status=?,feedback_note=?
            WHERE id=?
        `, [
            data.phase_id || null, data.parent_id || null,
            data.title, data.description || null,
            data.assigned_to || null, data.assigned_department_id || null,
            data.supporters ? JSON.stringify(data.supporters) : null,
            data.status, data.priority,
            data.due_date, data.start_date || null,
            data.is_milestone ? 1 : 0, data.position || 0,
            data.status === 'done' ? 100 : 0, data.estimated_h || null, data.actual_h || null,
            data.estimated_budget || 0, data.actual_budget || 0, data.feedback_status || 'none', data.feedback_note || null,
            id
        ]);

        // Ghi lịch sử
        for (const ch of changes) {
            await conn.query(
                "INSERT INTO task_history (task_id,user_id,action,old_value,new_value) VALUES (?,?,?,?,?)",
                [id, userId, ch.action, ch.old_value || null, ch.new_value || null]
            );
        }

        await conn.commit();

        // Thông báo (ngoài transaction)
        if (data.assigned_to && String(data.assigned_to) !== String(task.assigned_to)) {
            if (String(data.assigned_to) !== String(userId)) {
                await Notification.create({
                    user_id: data.assigned_to,
                    type: 'task_assigned',
                    title: 'Bạn được giao nhiệm vụ',
                    message: `"${task.title}"`,
                    link: `/events/${task.event_id}?tab=tasks`
                });
            }
        }
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateStatus = async (id, status, userId) => {
    if (!VALID_STATUSES.includes(status))
        throw { status: 400, message: "Trạng thái không hợp lệ" };
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query("UPDATE event_tasks SET status=?, progress=? WHERE id=?", [status, status === 'done' ? 100 : 0, id]);
        
        await conn.query(
            "INSERT INTO task_history (task_id,user_id,action,old_value,new_value) VALUES (?,?,?,?,?)",
            [id, userId, 'status_change', STATUS_LABEL[task.status], STATUS_LABEL[status]]
        );

        await conn.query(
            "INSERT INTO task_comments (task_id,user_id,content,type) VALUES (?,?,?,?)",
            [id, userId, `Chuyển trạng thái: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[status]}`, 'status_change']
        );

        await conn.commit();

        // Thông báo (ngoài transaction)
        const notifyIds = new Set();
        if (task.created_by && String(task.created_by) !== String(userId)) notifyIds.add(task.created_by);
        if (task.event_owner_id && String(task.event_owner_id) !== String(userId)) notifyIds.add(task.event_owner_id);

        if (notifyIds.size > 0) {
            let title = '';
            if (status === 'done') title = 'Nhiệm vụ đã hoàn thành ✅';
            else if (status === 'in_progress') title = 'Công việc đang được thực hiện 🔨';

            if (title) {
                for (const uid of notifyIds) {
                    await Notification.create({
                        user_id: uid, type: 'task_status', title,
                        message: `"${task.title}": ${STATUS_LABEL[status]}`,
                        link: `/events/${task.event_id}?tab=tasks`
                    });
                }
            }
        }
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateProgress = async (id, progress, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query("UPDATE event_tasks SET progress=? WHERE id=?", [Math.min(100, Math.max(0, progress)), id]);
        
        await conn.query(
            "INSERT INTO task_history (task_id,user_id,action,old_value,new_value) VALUES (?,?,?,?,?)",
            [id, userId, 'progress', `${task.progress}%`, `${progress}%`]
        );

        await conn.commit();

        const notifyIds = new Set();
        if (task.created_by && String(task.created_by) !== String(userId)) notifyIds.add(task.created_by);
        if (task.event_owner_id && String(task.event_owner_id) !== String(userId)) notifyIds.add(task.event_owner_id);

        if (notifyIds.size > 0 && progress > task.progress) {
            for (const uid of notifyIds) {
                await Notification.create({
                    user_id: uid, type: 'task_progress', title: 'Tiến độ công việc mới',
                    message: `"${task.title}" đã đạt ${progress}%`,
                    link: `/events/${task.event_id}?tab=tasks`
                });
            }
        }
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.reportIssue = async (id, note, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            "INSERT INTO task_comments (task_id,user_id,content,type) VALUES (?,?,?,?)",
            [id, userId, `⚠️ BÁO CÁO SỰ CỐ: ${note}`, 'comment']
        );

        await conn.query(
            "INSERT INTO task_history (task_id,user_id,action,new_value) VALUES (?,?,?,?)",
            [id, userId, 'issue_reported', note]
        );

        await conn.commit();

        const notifyIds = new Set();
        if (task.created_by && String(task.created_by) !== String(userId)) notifyIds.add(task.created_by);
        if (task.event_owner_id && String(task.event_owner_id) !== String(userId)) notifyIds.add(task.event_owner_id);

        if (notifyIds.size > 0) {
            for (const uid of notifyIds) {
                await Notification.create({
                    user_id: uid, type: 'task_issue', title: '⚠️ Báo cáo sự cố công việc',
                    message: `Nhiệm vụ "${task.title}": ${note}`,
                    link: `/events/${task.event_id}?tab=tasks`
                });
            }
        }
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateFeedback = async (id, data, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            "UPDATE event_tasks SET feedback_status=?, feedback_note=? WHERE id=?",
            [data.feedback_status || 'none', data.feedback_note || null, id]
        );

        await conn.query(
            "INSERT INTO task_history (task_id,user_id,action,new_value) VALUES (?,?,?,?)",
            [id, userId, 'feedback', `Trạng thái: ${data.feedback_status}, Ghi chú: ${data.feedback_note}`]
        );

        await conn.commit();

        if (task.assigned_to && String(task.assigned_to) !== String(userId)) {
            let title = 'Phản hồi mới từ quản lý';
            if (data.feedback_status === 'approved') title = 'Nhiệm vụ đã được duyệt ✅';
            if (data.feedback_status === 'rejected') title = 'Nhiệm vụ cần chỉnh sửa ⚠️';
            await Notification.create({
                user_id: task.assigned_to,
                type: 'task_feedback', title,
                message: `Nhiệm vụ "${task.title}": ${data.feedback_note || 'Quản lý đã để lại nhận xét'}`,
                link: `/events/${task.event_id}?tab=tasks`
            });
        }
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.delete = async (id) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    await Task.delete(id);
};

// ── Comments ──────────────────────────────────────────────────
exports.getComments = async (taskId) => await Task.getComments(taskId);

exports.addComment = async (taskId, content, userId) => {
    if (!content?.trim()) throw { status: 400, message: "Nội dung không được trống" };
    const task = await Task.getById(taskId);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    const id = await Task.addComment({ task_id: taskId, user_id: userId, content });
    if (task.assigned_to && String(task.assigned_to) !== String(userId)) {
        await Notification.create({
            user_id: task.assigned_to,
            type: 'task_comment',
            title: 'Có bình luận mới',
            message: `Trên nhiệm vụ "${task.title}"`,
            link: `/events/${task.event_id}?tab=tasks`
        });
    }
    return { id };
};

exports.deleteComment = async (id) => await Task.deleteComment(id);

// ── History ───────────────────────────────────────────────────
exports.getHistory = async (taskId) => await Task.getHistory(taskId);
