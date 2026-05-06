const svc = require("../services/departmentService");
const ok = (res, d, s = 200) => res.status(s).json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getAll = async (q, s) => { try { ok(s, await svc.getAll()); } catch (e) { err(s, e); } };
exports.getById = async (q, s) => { try { ok(s, await svc.getById(q.params.id)); } catch (e) { err(s, e); } };
exports.getEligibleManagers = async (q, s) => { try { ok(s, await svc.getEligibleManagers()); } catch (e) { err(s, e); } };
exports.create = async (q, s) => { try { ok(s, await svc.create(q.body), 201); } catch (e) { err(s, e); } };
exports.update = async (q, s) => { try { await svc.update(q.params.id, q.body); ok(s, { message: "Cập nhật thành công" }); } catch (e) { err(s, e); } };
exports.delete = async (q, s) => { try { await svc.delete(q.params.id); ok(s, { message: "Đã xóa phòng ban" }); } catch (e) { err(s, e); } };

// Employee management
exports.getEmployees = async (q, s) => { try { ok(s, await svc.getEmployees(q.params.id)); } catch (e) { err(s, e); } };
exports.getAvailableUsers = async (q, s) => { try { ok(s, await svc.getAvailableUsers(q.params.id)); } catch (e) { err(s, e); } };
exports.addEmployee = async (q, s) => { try { ok(s, await svc.addEmployee(q.params.id, q.body.user_id)); } catch (e) { err(s, e); } };
exports.removeEmployee = async (q, s) => { try { ok(s, await svc.removeEmployee(q.params.id, q.params.userId)); } catch (e) { err(s, e); } };
exports.updateEmployeeRole = async (q, s) => { try { ok(s, await svc.updateEmployeeRole(q.params.id, q.params.userId, q.body.role_in_dept)); } catch (e) { err(s, e); } };
