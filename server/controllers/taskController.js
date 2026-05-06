const svc = require("../services/taskService");
const ok = (res, d, s = 200) => res.status(s).json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });



// Tasks
exports.getByEvent = async (q, s) => { try { ok(s, await svc.getByEvent(q.params.eventId)); } catch (e) { err(s, e); } };
exports.getById = async (q, s) => { try { ok(s, await svc.getById(q.params.id)); } catch (e) { err(s, e); } };
exports.getStats = async (q, s) => { try { ok(s, await svc.getEventStats(q.params.eventId)); } catch (e) { err(s, e); } };
exports.getMyTasks = async (q, s) => { try { ok(s, await svc.getMyTasks(q.user.id)); } catch (e) { err(s, e); } };
exports.create = async (q, s) => { try { ok(s, await svc.create(q.body, q.user.id), 201); } catch (e) { err(s, e); } };
exports.update = async (q, s) => { try { await svc.update(q.params.id, q.body, q.user.id); ok(s, { message: "OK" }); } catch (e) { err(s, e); } };
exports.updateStatus = async (q, s) => { try { await svc.updateStatus(q.params.id, q.body.status, q.user.id); ok(s, { message: "OK" }); } catch (e) { err(s, e); } };
exports.updateProgress = async (q, s) => { try { await svc.updateProgress(q.params.id, q.body.progress, q.user.id); ok(s, { message: "OK" }); } catch (e) { err(s, e); } };
exports.reportIssue = async (q, s) => { try { await svc.reportIssue(q.params.id, q.body.note, q.user.id); ok(s, { message: "OK" }); } catch (e) { err(s, e); } };
exports.updateFeedback = async (q, s) => { try { await svc.updateFeedback(q.params.id, q.body, q.user.id); ok(s, { message: "OK" }); } catch (e) { err(s, e); } };
exports.delete = async (q, s) => { try { await svc.delete(q.params.id); ok(s, { message: "Đã xóa" }); } catch (e) { err(s, e); } };

// Comments
exports.getComments = async (q, s) => { try { ok(s, await svc.getComments(q.params.taskId)); } catch (e) { err(s, e); } };
exports.addComment = async (q, s) => { try { ok(s, await svc.addComment(q.params.taskId, q.body.content, q.user.id), 201); } catch (e) { err(s, e); } };
exports.deleteComment = async (q, s) => { try { await svc.deleteComment(q.params.commentId); ok(s, { message: "Đã xóa" }); } catch (e) { err(s, e); } };

// History
exports.getHistory = async (q, s) => { try { ok(s, await svc.getHistory(q.params.taskId)); } catch (e) { err(s, e); } };
