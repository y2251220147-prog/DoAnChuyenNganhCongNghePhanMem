const svc = require("../services/attendeeService");
const ok = (res, d, s = 200) => res.status(s).json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getAll = async (req, res) => { try { ok(res, await svc.getAllAttendees()); } catch (e) { err(res, e); } };
exports.getMyRegistrations = async (req, res) => { try { ok(res, await svc.getMyRegistrations(req.user.id)); } catch (e) { err(res, e); } };
exports.getByEvent = async (req, res) => { try { ok(res, await svc.getByEvent(req.params.eventId)); } catch (e) { err(res, e); } };
exports.getStats = async (req, res) => { try { ok(res, await svc.getStats(req.params.eventId)); } catch (e) { err(res, e); } };
exports.checkReg = async (req, res) => { try { ok(res, await svc.checkRegistration(req.params.eventId, req.user.id)); } catch (e) { err(res, e); } };
exports.addExternal = async (req, res) => { try { ok(res, await svc.addExternal(req.body, req.user.id), 201); } catch (e) { err(res, e); } };
exports.addBulkExternal = async (req, res) => { 
    try { 
        const dataList = req.body.guests ? req.body.guests : req.body;
        if (req.body.event_id && Array.isArray(dataList)) {
            dataList.forEach(g => {
                g.event_id = req.body.event_id;
                if (req.body.content) g.content = req.body.content;
            });
        }
        ok(res, await svc.addBulkExternal(dataList, req.user.id), 201); 
    } catch (e) { err(res, e); } 
};
exports.selfRegister = async (req, res) => { try { ok(res, await svc.selfRegister(req.params.eventId, req.user.id), 201); } catch (e) { err(res, e); } };
exports.remove = async (req, res) => { try { await svc.remove(req.params.id, req.user.id, req.user.role); ok(res, { message: "Đã xóa" }); } catch (e) { err(res, e); } };
exports.lookupByEmail = async (req, res) => { try { ok(res, await svc.lookupByEmail(req.query.email)); } catch (e) { err(res, e); } };
