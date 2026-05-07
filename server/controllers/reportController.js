const svc = require("../services/reportService");
const ok = (res, d) => res.json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getOverview = async (req, res) => { try { ok(res, await svc.getOverview()); } catch (e) { err(res, e); } };
exports.getEventsByMonth = async (req, res) => { try { ok(res, await svc.getEventsByMonth(req.query.year)); } catch (e) { err(res, e); } };
exports.getAttendeesByEvent = async (req, res) => { try { ok(res, await svc.getAttendeesByEvent()); } catch (e) { err(res, e); } };
exports.getBudgetByEvent = async (req, res) => { try { ok(res, await svc.getBudgetDetail()); } catch (e) { err(res, e); } };
exports.getTaskStats = async (req, res) => { try { ok(res, await svc.getTaskStats()); } catch (e) { err(res, e); } };
exports.getTaskDetail = async (req, res) => { try { ok(res, await svc.getTaskDetail()); } catch (e) { err(res, e); } };
exports.getAttendeeDetail = async (req, res) => { try { ok(res, await svc.getAttendeeDetail()); } catch (e) { err(res, e); } };
exports.getEventsByType = async (req, res) => { try { ok(res, await svc.getEventsByType()); } catch (e) { err(res, e); } };
exports.getFeedbackStats = async (req, res) => { try { ok(res, await svc.getFeedbackStats()); } catch (e) { err(res, e); } };
exports.getFeedbackDetail = async (req, res) => { try { ok(res, await svc.getFeedbackDetail()); } catch (e) { err(res, e); } };
