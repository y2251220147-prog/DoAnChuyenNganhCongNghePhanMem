const svc = require("../services/reportService");
const ok = (res, d) => res.json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getOverview = async (req, res) => { try { ok(res, await svc.getOverview()); } catch (e) { err(res, e); } };
exports.getEventsByMonth = async (req, res) => { try { ok(res, await svc.getEventsByMonth(req.query.year)); } catch (e) { err(res, e); } };
exports.getAttendeesByEvent = async (req, res) => { try { ok(res, await svc.getAttendeesByEvent()); } catch (e) { err(res, e); } };
exports.getBudgetByEvent = async (req, res) => { try { ok(res, await svc.getBudgetByEvent()); } catch (e) { err(res, e); } };
exports.getTaskStats = async (req, res) => { try { ok(res, await svc.getTaskStats()); } catch (e) { err(res, e); } };
exports.getEventsByType = async (req, res) => { try { ok(res, await svc.getEventsByType()); } catch (e) { err(res, e); } };
