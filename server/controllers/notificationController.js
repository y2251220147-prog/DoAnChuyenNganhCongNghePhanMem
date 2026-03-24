const svc = require("../services/notificationService");
const ok = (res, d, s = 200) => res.status(s).json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getMy = async (req, res) => { try { ok(res, await svc.getMyNotifications(req.user.id)); } catch (e) { err(res, e); } };
exports.getCount = async (req, res) => { try { ok(res, { count: await svc.getUnreadCount(req.user.id) }); } catch (e) { err(res, e); } };
exports.markRead = async (req, res) => { try { await svc.markRead(req.params.id, req.user.id); ok(res, { message: "OK" }); } catch (e) { err(res, e); } };
exports.markAllRead = async (req, res) => { try { await svc.markAllRead(req.user.id); ok(res, { message: "OK" }); } catch (e) { err(res, e); } };
exports.delete = async (req, res) => { try { await svc.delete(req.params.id); ok(res, { message: "Đã xóa" }); } catch (e) { err(res, e); } };
