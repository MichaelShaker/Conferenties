const db = require("../../config/db");
const mailService = require("../mailService");

const TOTAL_CAPACITY = 150;

async function getAvailability(month) {
    const [year, monthNumber] = month.split("-");

    if (!year || !monthNumber) {
        throw new Error("Ongeldige maand. Gebruik formaat: YYYY-MM");
    }

    const endDate = new Date(Number(year), Number(monthNumber), 0);
    const lastDay = endDate.getDate();

    const days = [];

    for (let day = 1; day <= lastDay; day++) {
        const date = `${year}-${monthNumber}-${String(day).padStart(2, "0")}`;

        const [blockedRows] = await db.query(
            "SELECT id FROM khelwa_blocked_dates WHERE blocked_date = ?",
            [date]
        );

        const isBlocked = blockedRows.length > 0;

        const [reservedRows] = await db.query(
            `
                SELECT COALESCE(SUM(group_size), 0) AS reserved_count
                FROM khelwa_reservations
                WHERE status = 'approved'
                  AND start_date <= ?
                  AND end_date >= ?
            `,
            [date, date]
        );

        const reservedCount = Number(reservedRows[0].reserved_count);
        const availableSpots = TOTAL_CAPACITY - reservedCount;

        days.push({
            date,
            blocked: isBlocked,
            reserved_count: reservedCount,
            available_spots: availableSpots,
            available: !isBlocked && availableSpots > 0
        });
    }

    return days;
}

async function createReservation(data) {
    const {
        user_id,
        reservation_type = "single",
        stay_type = "day",
        start_date,
        end_date,
        group_size = 1,
        guests = []
    } = data;

    if (!user_id) {
        throw new Error("Je moet ingelogd zijn om een reservering te maken");
    }

    if (!start_date || !end_date) {
        throw new Error("Startdatum en einddatum zijn verplicht");
    }

    const requestedGroupSize = Number(group_size);

    if (requestedGroupSize < 1) {
        throw new Error("Groepsgrootte moet minimaal 1 zijn");
    }

    if (new Date(end_date) < new Date(start_date)) {
        throw new Error("Einddatum mag niet vóór startdatum liggen");
    }

    if (!["single", "group"].includes(reservation_type)) {
        throw new Error("Ongeldig reserveringstype");
    }

    if (!["day", "overnight"].includes(stay_type)) {
        throw new Error("Ongeldig verblijfstype");
    }

    const [userRows] = await db.query(
        `
        SELECT 
            u.id,
            u.name,
            u.email,
            up.phone,
            up.first_name,
            up.last_name
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE u.id = ?
        `,
        [user_id]
    );

    if (userRows.length === 0) {
        throw new Error("Gebruiker niet gevonden");
    }

    const accountUser = userRows[0];

    const requester_name =
        `${accountUser.first_name || ""} ${accountUser.last_name || ""}`.trim()
        || accountUser.name;

    const requester_email = accountUser.email;
    const requester_phone = accountUser.phone || null;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [blockedRows] = await connection.query(
            `
                SELECT blocked_date
                FROM khelwa_blocked_dates
                WHERE blocked_date BETWEEN ? AND ?
            `,
            [start_date, end_date]
        );

        if (blockedRows.length > 0) {
            throw new Error("Een of meerdere gekozen dagen zijn geblokkeerd");
        }

        const [reservedRows] = await connection.query(
            `
                SELECT COALESCE(SUM(group_size), 0) AS reserved_count
                FROM khelwa_reservations
                WHERE status = 'approved'
                  AND start_date <= ?
                  AND end_date >= ?
            `,
            [end_date, start_date]
        );

        const reservedCount = Number(reservedRows[0].reserved_count);

        if (reservedCount + requestedGroupSize > TOTAL_CAPACITY) {
            throw new Error("Niet genoeg beschikbare plekken voor deze periode");
        }

        const [result] = await connection.query(
            `
                INSERT INTO khelwa_reservations
                (
                    user_id,
                    requester_name,
                    requester_email,
                    requester_phone,
                    reservation_type,
                    stay_type,
                    start_date,
                    end_date,
                    group_size,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `,
            [
                user_id,
                requester_name,
                requester_email,
                requester_phone,
                reservation_type,
                stay_type,
                start_date,
                end_date,
                requestedGroupSize
            ]
        );

        const reservationId = result.insertId;

        if (Array.isArray(guests) && guests.length > 0) {
            for (const guest of guests) {
                if (!guest.full_name) {
                    throw new Error("Elke gast moet een naam hebben");
                }

                await connection.query(
                    `
                        INSERT INTO khelwa_guests
                        (
                            reservation_id,
                            full_name,
                            age,
                            notes
                        )
                        VALUES (?, ?, ?, ?)
                    `,
                    [
                        reservationId,
                        guest.full_name,
                        guest.age || null,
                        guest.notes || null
                    ]
                );
            }
        }

        await connection.commit();

        return {
            id: reservationId,
            user_id,
            requester_name,
            requester_email,
            requester_phone,
            reservation_type,
            stay_type,
            start_date,
            end_date,
            group_size: requestedGroupSize,
            status: "pending"
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getReservationsByUser(userId) {
    const [rows] = await db.query(
        `
            SELECT *
            FROM khelwa_reservations
            WHERE user_id = ?
            ORDER BY created_at DESC
        `,
        [userId]
    );

    return rows;
}

async function getAllReservations() {
    const [rows] = await db.query(
        `
            SELECT *
            FROM khelwa_reservations
            ORDER BY created_at DESC
        `
    );

    return rows;
}

async function getReservationDetails(id) {
    const [reservationRows] = await db.query(
        `
        SELECT *
        FROM khelwa_reservations
        WHERE id = ?
        `,
        [id]
    );

    if (reservationRows.length === 0) {
        throw new Error("Reservering niet gevonden");
    }

    const [guestRows] = await db.query(
        `
        SELECT *
        FROM khelwa_guests
        WHERE reservation_id = ?
        ORDER BY id ASC
        `,
        [id]
    );

    const [roomRows] = await db.query(
        `
        SELECT 
            kra.*,
            kr.room_number,
            kr.capacity
        FROM khelwa_room_assignments kra
        JOIN khelwa_rooms kr ON kra.room_id = kr.id
        WHERE kra.reservation_id = ?
        ORDER BY kr.room_number ASC
        `,
        [id]
    );

    return {
        ...reservationRows[0],
        guests: guestRows,
        rooms: roomRows
    };
}

async function approveReservation(id, adminNote) {
    const [rows] = await db.query(
        "SELECT * FROM khelwa_reservations WHERE id = ?",
        [id]
    );

    if (rows.length === 0) {
        throw new Error("Reservering niet gevonden");
    }

    const reservation = rows[0];

    await db.query(
        `
            UPDATE khelwa_reservations
            SET status = 'approved',
                admin_note = ?,
                approved_at = NOW()
            WHERE id = ?
        `,
        [adminNote || null, id]
    );

    await mailService.sendMail(
        reservation.requester_email,
        "Khelwa reservering goedgekeurd",
        `
        <h2>Beste ${reservation.requester_name},</h2>
        <p>Je Khelwa reservering is goedgekeurd.</p>
        <p><strong>Datum:</strong> ${reservation.start_date} t/m ${reservation.end_date}</p>
        <p><strong>Aantal personen:</strong> ${reservation.group_size}</p>
        <p>God bless.</p>
        `
    );

    return {
        id,
        status: "approved"
    };
}

async function rejectReservation(id, adminNote) {
    const [rows] = await db.query(
        "SELECT * FROM khelwa_reservations WHERE id = ?",
        [id]
    );

    if (rows.length === 0) {
        throw new Error("Reservering niet gevonden");
    }

    const reservation = rows[0];

    await db.query(
        `
            UPDATE khelwa_reservations
            SET status = 'rejected',
                admin_note = ?,
                rejected_at = NOW()
            WHERE id = ?
        `,
        [adminNote || null, id]
    );

    await mailService.sendMail(
        reservation.requester_email,
        "Khelwa reservering afgekeurd",
        `
        <h2>Beste ${reservation.requester_name},</h2>
        <p>Je Khelwa reservering is helaas afgekeurd.</p>
        ${adminNote ? `<p><strong>Opmerking:</strong> ${adminNote}</p>` : ""}
        <p>God bless.</p>
        `
    );

    return {
        id,
        status: "rejected"
    };
}

async function blockDate(blockedDate, reason) {
    if (!blockedDate) {
        throw new Error("Datum is verplicht");
    }

    await db.query(
        `
        INSERT INTO khelwa_blocked_dates (blocked_date, reason)
        VALUES (?, ?)
        `,
        [blockedDate, reason || null]
    );
}

async function unblockDate(blockedDate) {
    if (!blockedDate) {
        throw new Error("Datum is verplicht");
    }

    await db.query(
        `
        DELETE FROM khelwa_blocked_dates
        WHERE blocked_date = ?
        `,
        [blockedDate]
    );
}

module.exports = {
    getAvailability,
    createReservation,
    getReservationsByUser,
    getAllReservations,
    getReservationDetails,
    approveReservation,
    rejectReservation,
    blockDate,
    unblockDate
};