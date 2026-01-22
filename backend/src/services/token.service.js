const db = require("../models/db");
function pad(num) {
  return num.toString().padStart(3, "0");
}
function getPriorityFlag(age, gender, divyang) {
  if (divyang === "Yes") return "P";
  if (age >= 60) return "P";
  if (gender === "Female" && age >= 50) return "P";
  return "N";
}
async function generateDailyToken(name, mobile, date, age, gender, divyang, mode) {
  const priority = getPriorityFlag(age, gender, divyang);
  const key = `${mode}${priority}`; 
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO daily_token_counters (date) VALUES (?)`,
      [date],
      err => (err ? reject(err) : resolve())
    );
  });

  const columnMap = {
    AP: "ap_count",
    AN: "an_count",
    WP: "wp_count",
    WN: "wn_count"
  };

  const column = columnMap[key];

  const count = await new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE daily_token_counters
      SET ${column} = ${column} + 1
      WHERE date = ?
      `,
      [date],
      err => {
        if (err) return reject(err);

        db.get(
          `SELECT ${column} FROM daily_token_counters WHERE date = ?`,
          [date],
          (err, row) => {
            if (err) reject(err);
            else resolve(row[column]);
          }
        );
      }
    );
  });

  const seq = pad(count);
  return `${name}-${mobile}-${seq}-${key}`;
}

module.exports = {
  generateDailyToken
};
  