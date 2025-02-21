require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');

const cors = require('cors');
const app = express();
app.use(express.json());

app.use(express.urlencoded({extended : true}));

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

app.get('/fl_conservation-public', async (req, res) => {

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
 
  const client = await pool.connect();

  const result = await client.query(
    `select geojson from ${process.env.FLCONSERVEPUBLIC};`);

  client.release();

  const features = result.rows 

  var featureArr = [];

  for(var i = 0 ; i<features.length; i++){

    featureArr.push(features[i].geojson);

  }

  res.json(featureArr);

});

app.get('/geocode-place', async ( req, res) => {

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  const userInput = req.query.userInput;
  const userLat = parseFloat(req.query.lat);
  const userLon = parseFloat(req.query.lon); 

  const client = await pool.connect();

  const result = await client.query(`select geomatch($1 , $2 , $3)` , [userInput , userLat , userLon]);

  client.release();

  res.json({result});
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`); 
}); 