const pool = require("../config/db");

async function getAllChurches() {
    const [rows] = await pool.query(`
        SELECT id, name, city, country
        FROM churches
        ORDER BY city ASC, name ASC
    `);

    return rows;
}

module.exports = {
    getAllChurches
};