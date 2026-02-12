const db = require("../models/db");
const { GUARD_USERNAME, GUARD_PASSWORD } =
  require("../utils/guard.config");

// LOGIN
exports.guardLogin = (req, res) => {
  const { username, password } = req.body;

  if (
    username === GUARD_USERNAME &&
    password === GUARD_PASSWORD
  ) {
    return res.json({
      success: true,
      token: "GUARD_TOKEN"
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
};

// TODAY TOKENS ONLY
exports.getTodayTokens = (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.all(
    `
    SELECT *
    FROM tokens
    WHERE date = ?
    AND (
      visited = 0
      OR (visited = 1 AND datetime(visited_at) >= datetime('now', '-10 minutes'))
    )
    ORDER BY created_at ASC
    `,
    [today],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows);
    }
  );
};
exports.markVisited = (req, res) => {
  const { token_id } = req.body;

  db.run(
    `
    UPDATE tokens
    SET visited = 1,
        visited_at = datetime('now', 'localtime')
    WHERE id = ?
    `,
    [token_id],
    err => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ success: true });
    }
  );
};
exports.undoVisited = (req, res) => {
  const { token_id } = req.body;

  db.run(
    `
    UPDATE tokens
    SET visited = 0,
        visited_at = NULL
    WHERE id = ?
      AND visited = 1
      AND datetime(visited_at) >= datetime('now', '-10 minutes')
    `,
    [token_id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }

      if (this.changes === 0) {
        return res.status(403).json({
          message: "Undo window expired"
        });
      }

      res.json({ success: true });
    }
  );
};


