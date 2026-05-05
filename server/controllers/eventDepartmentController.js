const svc = require("../services/eventDepartmentService");
const ok = (res, d, s = 200) => res.status(s).json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getAll = async (req, res) => { try { ok(res, await svc.getAll()); } catch (e) { err(res, e); } };
exports.getByEvent = async (req, res) => { try { ok(res, await svc.getByEvent(req.params.eventId)); } catch (e) { err(res, e); } };
exports.assign = async (req, res) => { try { ok(res, await svc.assign(req.body), 201); } catch (e) { err(res, e); } };
exports.remove = async (req, res) => { try { ok(res, await svc.remove(req.params.id)); } catch (e) { err(res, e); } };
exports.update = async (req, res) => { try { ok(res, await svc.update(req.params.id, req.body)); } catch (e) { err(res, e); } };
