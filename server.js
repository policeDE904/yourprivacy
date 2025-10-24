const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Підключення до бази через змінні середовища (Railway або локально)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "123ars",
  password: process.env.DB_PASSWORD || "123",
  database: process.env.DB_NAME || "usersdb"
});

db.connect(err => {
  if (err) {
    console.error("❌ DB connection error:", err);
  } else {
    console.log("✅ Connected to MySQL database!");
  }
});

// 🧠 Реєстрація
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).send("Please fill in all fields");

  try {
    const hashed = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed],
      err => {
        if (err) {
          console.error(err);
          res.status(500).send("❌ Email already exists or DB error");
        } else {
          res.send("✅ User registered successfully!");
        }
      }
    );
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});

// 🔑 Вхід
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send("Please fill in all fields");

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.status(400).send("User not found");

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).send("Wrong password");

    res.send(`✅ Welcome, ${user.name}!`);
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
