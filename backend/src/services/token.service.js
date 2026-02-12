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
//async function generateDailyToken(name, mobile, date, age, gender, divyang, mode) {
//  const priority = getPriorityFlag(age, gender, divyang);
//  const key = `${mode}${priority}`; 
//  await new Promise((resolve, reject) => {
//    db.run(
//      `INSERT OR IGNORE INTO daily_token_counters (date) VALUES (?)`,
//      [date],
//      err => (err ? reject(err) : resolve())
//    );
//  });
//
//  const columnMap = {
//    AP: "ap_count",
//    AN: "an_count",
//    WP: "wp_count",
//    WN: "wn_count"
//  };
//
//  const column = columnMap[key];
//
//  const count = await new Promise((resolve, reject) => {
//    db.run(
//      `
//      UPDATE daily_token_counters
//      SET ${column} = ${column} + 1
//      WHERE date = ?
//      `,
//      [date],
//      err => {
//        if (err) return reject(err);
//
//        db.get(
//          `SELECT ${column} FROM daily_token_counters WHERE date = ?`,
//          [date],
//          (err, row) => {
//            if (err) reject(err);
//            else resolve(row[column]);
//          }
//        );
//      }
//    );
//  });
//
//  const seq = pad(count);
//  return {token: `${name}-${mobile}-${seq}-${key}`, priority};
//}
async function generateDailyToken(
  name,
  mobile,
  aadhaar_last4,
  date,
  age,
  gender,
  divyang,
  mode,
  tokenType   // ?? NEW: AN / AP / WN / WP / WL
) {
  const priority = getPriorityFlag(age, gender, divyang);

  // ensure row exists
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO daily_token_counters (date, last_token)
       VALUES (?, 0)`,
      [date],
      err => (err ? reject(err) : resolve())
    );
  });

  // ?? GLOBAL COUNT
  const seq = await new Promise((resolve, reject) => {
    db.run(
      `UPDATE daily_token_counters
       SET last_token = last_token + 1
       WHERE date = ?`,
      [date],
      err => {
        if (err) return reject(err);
        db.get(
          `SELECT last_token FROM daily_token_counters WHERE date = ?`,
          [date],
          (err, row) => err ? reject(err) : resolve(row.last_token)
        );
      }
    );
  });

  // ? keep old counters updated (admin stats safe)
  const map = {
    AP: "ap_count",
    AN: "an_count",
    WP: "wp_count",
    WN: "wn_count",
    WL: "wn_count" // WL counts as WN
  };

  const col = map[tokenType];
  if (col) {
    db.run(
      `UPDATE daily_token_counters SET ${col} = ${col} + 1 WHERE date = ?`,
      [date]
    );
  }

  const padded = pad(seq);
  return {
    token: `${padded}-${tokenType}-${aadhaar_last4}`,
    priority
  };
}


module.exports = {
  generateDailyToken
};
  
