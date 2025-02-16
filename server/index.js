require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');

const cors = require('cors');
const app = express();

app.use(cors({
  origin: "http://127.0.0.1:5500", // Adjust if using a different frontend port
  credentials: true // Required for sending cookies
}));

const PORT = process.env.PORT || 4242;


app.get('/viirs-public', async (_, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();
  const result = await client.query(`select * from ${process.env.VIIRSPUBLIC};`);
  client.release();

  const rows = result.rows

  res.json({ rows });
});

app.get('/wfigs-public', async (_, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();
  const result = await client.query(`select * from ${process.env.WFIGSPUBLIC};`);
  client.release();
 
  const rows = result.rows

  res.json({ rows });
});

app.get('/fl_conservation-public', async (_, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();
  const result = await client.query(`select * from ${process.env.FLCONSERVEPUBLIC};`);
  client.release();

  const rows = result.rows

  res.json({ rows });
});

app.get("/", (_, res) => {
  res.json({message: "Hello Test"});
})

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
}); 