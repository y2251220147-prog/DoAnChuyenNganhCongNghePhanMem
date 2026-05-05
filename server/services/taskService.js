const Task = require("../models/taskModel");
const Attendee = require("../models/attendeeModel");
const Notification = require("../models/notificationModel");

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABEL = {
    todo: 'Chuẩn bị',
    in_progress: 'Đang làm',
    done: 'Hoàn thành'
};

// ── Kiểm tra attendee lock ─────────────────────────────────
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



// ── Tasks ─────────────────────────────────────────────────────
exports.getByEvent = async (eid) => await Task.getByEvent(eid);
exports.getById = async (id) => {
    const t = await Task.getById(id);
    if (!t) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    return t;
};
exports.getEventStats = async (eid) => await Task.getEventStats(eid);

exports.create = async (data, creatorId) => {
    if (!data.event_id || !data.title)
        throw { status: 400, message: "event_id và title là bắt buộc" };
    if (!data.due_date)
        throw { status: 400, message: "Deadline (due_date) là bắt buộc khi tạo nhiệm vụ" };

    // Kiểm tra attendee conflict
    if (data.assigned_to) {
        await checkAttendeeConflict(data.event_id, data.assigned_to);
    }

    const id = await Task.create({ ...data, created_by: creatorId });

    // Ghi lịch sử
    await Task.addHistory({ task_id: id, user_id: creatorId, action: 'created', new_value: data.title });

    // Thông báo người được giao
    if (data.assigned_to && String(data.assigned_to) !== String(creatorId)) {
        await Notification.create({
            user_id: data.assigned_to,
            type: 'task_assigned',
            title: 'Bạn được giao nhiệm vụ mới',
            message: `"${data.title}"`,
            link: `/events/${data.event_id}?tab=tasks`
        });
    }

    return { id };
};

exports.update = async (id, data, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };

    const changes = [];

    // Theo dõi thay đổi status
    if (data.status && data.status !== task.status) {
        if (!VALID_STATUSES.includes(data.status))
            throw { status: 400, message: "Trạng thái không hợp lệ. Chỉ chấp nhận: todo, in_progress, done" };
        changes.push({ action: 'status_change', old_value: STATUS_LABEL[task.status], new_value: STATUS_LABEL[data.status] });
        await Task.addComment({
            task_id: id, user_id: userId,
            content: `Chuyển trạng thái: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[data.status]}`,
            type: 'status_change'
        });
    }

    // Kiểm tra attendee conflict khi thay đổi người phụ trách
    if (data.assigned_to && String(data.assigned_to) !== String(task.assigned_to)) {
        await checkAttendeeConflict(task.event_id, data.assigned_to);
        changes.push({ action: 'assign', old_value: task.assigned_name || '', new_value: data.assigned_to });
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

    // Theo dõi thay đổi deadline
    if (data.due_date && data.due_date !== task.due_date) {
        changes.push({ action: 'due_date', old_value: task.due_date, new_value: data.due_date });
    }

    await Task.update(id, { ...task, ...data });

    for (const ch of changes) {
        await Task.addHistory({ task_id: id, user_id: userId, ...ch });
    }
};

exports.updateStatus = async (id, status, userId) => {
    if (!VALID_STATUSES.includes(status))
        throw { status: 400, message: "Trạng thái không hợp lệ. Chỉ chấp nhận: todo, in_progress, done" };
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };

    await Task.updateStatus(id, status);
    await Task.addHistory({
        task_id: id, user_id: userId, action: 'status_change',
        old_value: STATUS_LABEL[task.status], new_value: STATUS_LABEL[status]
    });
    await Task.addComment({
        task_id: id, user_id: userId,
        content: `Chuyển trạng thái: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[status]}`,
        type: 'status_change'
    });

    // Thông báo creator khi done
    if (status === 'done' && task.created_by && String(task.created_by) !== String(userId)) {
        await Notification.create({
            user_id: task.created_by,
            type: 'task_done',
            title: 'Nhiệm vụ đã hoàn thành',
            message: `"${task.title}" đã được đánh dấu hoàn thành`,
            link: `/events/${task.event_id}?tab=tasks`
        });
    }
};

exports.updateProgress = async (id, progress, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    await Task.updateProgress(id, progress);
    await Task.addHistory({
        task_id: id, user_id: userId, action: 'progress',
        old_value: `${task.progress}%`, new_value: `${progress}%`
    });
};

exports.updateFeedback = async (id, data, userId) => {
    const task = await Task.getById(id);
    if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
    await Task.updateFeedback(id, data);
    await Task.addHistory({
        task_id: id, user_id: userId, action: 'feedback',
        new_value: `Trạng thái: ${data.feedback_status}, Ghi chú: ${data.feedback_note}`
    });

    if (task.assigned_to && String(task.assigned_to) !== String(userId)) {
        let title = 'Phản hồi mới từ quản lý';
        if (data.feedback_status === 'approved') title = 'Nhiệm vụ đã được duyệt ✅';
        if (data.feedback_status === 'rejected') title = 'Nhiệm vụ cần chỉnh sửa ⚠️';
        await Notification.create({
            user_id: task.assigned_to,
            type: 'task_feedback',
            title,
            message: `Nhiệm vụ "${task.title}": ${data.feedback_note || 'Quản lý đã để lại nhận xét'}`,
            link: `/events/${task.event_id}?tab=tasks`
        });
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
