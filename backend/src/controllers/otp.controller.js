// const db = require("../models/db");
// const { generateOTP } = require("../utils/otp");

// exports.sendOTP = async (req, res) => {
//   const { mobile } = req.body;
//   if (!mobile) return res.status(400).json({ message: "Mobile required" });

//   const otp = generateOTP();
//   const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

//   db.run(
//     `
//     INSERT INTO otp_verifications (mobile, otp, expires_at, attempts, verified)
//     VALUES (?, ?, ?, 0, 0)
//     ON CONFLICT(mobile) DO UPDATE SET
//       otp = excluded.otp,
//       expires_at = excluded.expires_at,
//       attempts = 0,
//       verified = 0
//     `,
//     [mobile, otp, expiresAt],
//     err => {
//       if (err) return res.status(500).json({ message: "OTP failed" });

//       // 📲 TEMP: console log (later SMS gateway)
//       console.log("OTP for", mobile, ":", otp);

//       res.json({ message: "OTP sent" });
//     }
//   );
// };

// exports.verifyOTP = (req, res) => {
//   const { mobile, otp } = req.body;

//   db.get(
//     "SELECT * FROM otp_verifications WHERE mobile = ?",
//     [mobile],
//     (err, row) => {
//       if (!row) return res.status(400).json({ message: "OTP not requested" });

//       if (row.verified)
//         return res.json({ message: "Already verified" });

//       if (Date.now() > row.expires_at)
//         return res.status(400).json({ message: "OTP expired" });

//       if (row.attempts >= 3)
//         return res.status(400).json({ message: "Too many attempts" });

//       if (row.otp !== otp) {
//         db.run(
//           "UPDATE otp_verifications SET attempts = attempts + 1 WHERE mobile = ?",
//           [mobile]
//         );
//         return res.status(400).json({ message: "Invalid OTP" });
//       }

//       db.run(
//         "UPDATE otp_verifications SET verified = 1 WHERE mobile = ?",
//         [mobile]
//       );

//       res.json({ message: "OTP verified" });
//     }
//   );
// };
