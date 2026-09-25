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

  let tableRows = "";

  rows.forEach(item => {
    tableRows += `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>
          <a href="/edit/${item.id}">Edit</a>

          <form method="POST"
                action="/delete/${item.id}"
                style="display:inline;">
            <button>Delete</button>
          </form>
        </td>
      </tr>
    `;
  });

  res.send(`
    <html>
    <head>
      <title>TMG CRUD Demo</title>
    </head>
    <body>
      <h1>TMG Simple CRUD Application</h1>

      <form method="POST" action="/add">
        <input name="name" placeholder="Item Name" required>
        <input type="number" name="quantity" placeholder="Quantity" required>
        <button>Add Item</button>
      </form>

      <br>

      <table border="1" cellpadding="10">
        <tr>
          <th>ID</th>
          <th>Item</th>
          <th>Quantity</th>
          <th>Action</th>
        </tr>

        ${tableRows}
      </table>
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
    <h2>Edit Item</h2>

    <form method="POST" action="/update/${item.id}">
      <input name="name" value="${item.name}" required>

      <input
        type="number"
        name="quantity"
        value="${item.quantity}"
        required>

      <button>Update</button>
    </form>

    <br>
    <a href="/">Back</a>
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
