const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "cruduser",
  password: process.env.DB_PASSWORD || "crudpassword",
  database: process.env.DB_NAME || "cruddb",
  port: 3306
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

async function initDB() {
  const connection = await getConnection();

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      quantity INT DEFAULT 0
    )
  `);

  await connection.end();
}

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/", async (req, res) => {
  const connection = await getConnection();

  const [rows] = await connection.execute(
    "SELECT * FROM items ORDER BY id"
  );

  await connection.end();

  const totalItems = rows.length;
  const totalQuantity = rows.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  let tableRows = "";

  rows.forEach(item => {
    tableRows += `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>
          <a class="btn edit" href="/edit/${item.id}">
            Edit
          </a>

          <form method="POST"
                action="/delete/${item.id}"
                style="display:inline;">
            <button class="btn delete" type="submit">
              Delete
            </button>
          </form>
        </td>
      </tr>
    `;
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>TMG Inventory Dashboard</title>

      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f6f8;
          color: #222;
        }

        .header {
          background: #20232a;
          color: white;
          padding: 24px 40px;
        }

        .header h1 {
          margin: 0;
        }

        .header p {
          margin-top: 6px;
          color: #c8c8c8;
        }

        .container {
          max-width: 1000px;
          margin: 30px auto;
          padding: 0 20px;
        }

        .cards {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
        }

        .card {
          flex: 1;
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .card h3 {
          margin-top: 0;
          color: #555;
        }

        .card .value {
          font-size: 28px;
          font-weight: bold;
        }

        .panel {
          background: white;
          border-radius: 10px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 25px;
        }

        input {
          padding: 10px;
          margin-right: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }

        button {
          cursor: pointer;
        }

        .btn {
          display: inline-block;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
        }

        .add {
          background: #2563eb;
          color: white;
        }

        .edit {
          background: #f59e0b;
          color: white;
        }

        .delete {
          background: #dc2626;
          color: white;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f1f3f5;
          text-align: left;
        }

        th, td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }

        .version {
          margin-top: 20px;
          font-size: 13px;
          color: #777;
        }
      </style>
    </head>

    <body>

      <div class="header">
        <h1>TMG Inventory Dashboard</h1>
        <p>OpenShift GitOps / Argo CD Demo</p>
      </div>

      <div class="container">

        <div class="cards">

          <div class="card">
            <h3>Total Records</h3>
            <div class="value">${totalItems}</div>
          </div>

          <div class="card">
            <h3>Total Quantity</h3>
            <div class="value">${totalQuantity}</div>
          </div>

        </div>

        <div class="panel">

          <h2>Add Inventory Item</h2>

          <form method="POST" action="/add">

            <input
              name="name"
              placeholder="Item Name"
              required>

            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              required>

            <button class="btn add" type="submit">
              Add Item
            </button>

          </form>

        </div>

        <div class="panel">

          <h2>Inventory List</h2>

          <table>

            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>

            ${tableRows}

          </table>

        </div>

        <div class="version">
          Application Version: 1.1
        </div>

      </div>

    </body>
    </html>
  `);
});

app.post("/add", async (req, res) => {
  const connection = await getConnection();

  await connection.execute(
    "INSERT INTO items(name, quantity) VALUES(?, ?)",
    [req.body.name, req.body.quantity]
  );

  await connection.end();

  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const connection = await getConnection();

  const [rows] = await connection.execute(
    "SELECT * FROM items WHERE id = ?",
    [req.params.id]
  );

  await connection.end();

  const item = rows[0];

  if (!item) {
    return res.status(404).send("Item not found");
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Edit Item</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f8;
        }

        .box {
          width: 400px;
          margin: 80px auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        input {
          width: 100%;
          padding: 10px;
          margin-bottom: 12px;
          box-sizing: border-box;
        }

        button {
          padding: 10px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      </style>
    </head>

    <body>

      <div class="box">

        <h2>Edit Inventory Item</h2>

        <form method="POST" action="/update/${item.id}">

          <input
            name="name"
            value="${item.name}"
            required>

          <input
            type="number"
            name="quantity"
            value="${item.quantity}"
            required>

          <button type="submit">
            Update Item
          </button>

        </form>

        <br>

        <a href="/">Back to Inventory</a>

      </div>

    </body>
    </html>
  `);
});

app.post("/update/:id", async (req, res) => {
  const connection = await getConnection();

  await connection.execute(
    "UPDATE items SET name = ?, quantity = ? WHERE id = ?",
    [
      req.body.name,
      req.body.quantity,
      req.params.id
    ]
  );

  await connection.end();

  res.redirect("/");
});

app.post("/delete/:id", async (req, res) => {
  const connection = await getConnection();

  await connection.execute(
    "DELETE FROM items WHERE id = ?",
    [req.params.id]
  );

  await connection.end();

  res.redirect("/");
});

initDB()
  .then(() => {
    app.listen(8080, "0.0.0.0", () => {
      console.log("TMG CRUD application running on port 8080");
    });
  })
  .catch(error => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
