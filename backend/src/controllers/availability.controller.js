const db = require("../models/db");
const { DEFAULT_WALKIN_SLOTS } = require("../utils/constants");

/**
 * APPOINTMENT AVAILABILITY
 * supports ?disableToday=true
 */
exports.getAvailability = (req, res) => {
  const disableToday = req.query.disableToday === "true";

  const start = new Date();
  if (disableToday) {
    start.setDate(start.getDate() + 1); // ⛔ skip today
  }

  const daysAhead = 30;
  const startDate = start.toISOString().split("T")[0];

  db.all(
    `
    SELECT date, appointment_total, appointment_booked
    FROM daily_slots
    WHERE date >= ?
    ORDER BY date ASC
    LIMIT ?
    `,
    [startDate, daysAhead],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }

      const result = rows.map(r => {
        const d = new Date(r.date);
        const day = d.getDay();
        const isHoliday = day === 0 || day === 6;
        const available =
          isHoliday ? 0 : r.appointment_total - r.appointment_booked;

        return {
          date: r.date,
          appointment_total: r.appointment_total,
          appointment_booked: r.appointment_booked,
          available_slots: available,
          status: isHoliday
            ? "HOLIDAY"
            : available <= 0
            ? "FULL"
            : "AVAILABLE"
        };
      });

      res.json(result);
    }
  );
};

/**
 * WALK-IN AVAILABILITY (TODAY ONLY)
 */
exports.getWalkinAvailability = (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.get(
    `
    SELECT COUNT(*) as used
    FROM tokens
    WHERE date = ? AND mode = 'W'
    `,
    [today],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }

      const used = row.used || 0;
      const available = Math.max(
        DEFAULT_WALKIN_SLOTS - used,
        0
      );

      res.json({
        date: today,
        total_slots: DEFAULT_WALKIN_SLOTS,
        used_slots: used,
        available_slots: available
      });
    }
  );
};
