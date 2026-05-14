const adminService = require("../services/adminService");
const { logAudit } = require("../services/auditService");

async function getAuditLogs(req, res) {
    try {
        const logs = await adminService.getAuditLogs(req.query.limit || 100);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error("Audit logs error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch audit logs"
        });
    }
}

async function getEmailLogs(req, res) {
    try {
        const logs = await adminService.getEmailLogs(req.query.limit || 100);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error("Email logs error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch email logs"
        });
    }
}

async function getUsers(req, res) {
    try {
        const users = await adminService.getUsers();

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("Admin users error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch users"
        });
    }
}

async function updateUser(req, res) {
    try {
        const { id } = req.params;

        if (Number(id) === Number(req.user.id) && req.body.role && req.body.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "You cannot remove your own admin role"
            });
        }

        const user = await adminService.updateUser(id, req.body);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found or no valid changes"
            });
        }

        await logAudit({
            actorUserId: req.user.id,
            action: "user.updated",
            entityType: "user",
            entityId: Number(id),
            details: {
                role: req.body.role,
                newsletterEnabled: req.body.newsletterEnabled
            }
        });

        res.json({
            success: true,
            message: "User updated",
            data: user
        });
    } catch (error) {
        console.error("Update user error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not update user"
        });
    }
}

async function getSystemStatus(req, res) {
    try {
        const status = await adminService.getSystemStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error("System status error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch system status"
        });
    }
}

module.exports = {
    getAuditLogs,
    getEmailLogs,
    getUsers,
    updateUser,
    getSystemStatus
};
