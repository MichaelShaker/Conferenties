const churchService = require("../services/churchService");

async function getChurches(req, res) {
    try {
        const churches = await churchService.getAllChurches();

        res.json({
            success: true,
            data: churches
        });
    } catch (error) {
        console.error("Error fetching churches:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not fetch churches"
        });
    }
}

module.exports = {
    getChurches
};