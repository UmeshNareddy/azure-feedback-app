const express = require("express");
const sql = require("mssql");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
  connectionString: process.env.SQL_CONNECTION_STRING,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/feedback", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT TOP 50
        Id,
        VisitorName,
        Email,
        Message,
        SubmittedAt
      FROM Feedback
      ORDER BY SubmittedAt DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Read error:", error.message);
    res.status(500).json({ error: "Could not retrieve feedback from the database." });
  }
});

app.post("/api/feedback", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !name.trim() || !message || !message.trim()) {
    return res.status(400).json({
      error: "Name and message are required."
    });
  }

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("name", sql.NVarChar(100), name.trim())
      .input("email", sql.NVarChar(255), email ? email.trim() : null)
      .input("message", sql.NVarChar(1000), message.trim())
      .query(`
        INSERT INTO Feedback (VisitorName, Email, Message)
        VALUES (@name, @email, @message)
      `);

    res.status(201).json({
      message: "Thank you. Your feedback was saved to Azure SQL Database."
    });
  } catch (error) {
    console.error("Insert error:", error.message);
    res.status(500).json({
      error: "Could not save feedback. Please try again."
    });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
