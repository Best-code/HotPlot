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


const PORT = process.env.PORT || 4242; //MODIFY when hosted


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
 

  result = await pool.query(`select geojson from ${process.env.FLCONSERVEPUBLIC};`);

  const features = result.rows 

  var featureArr = [];

  for(var i = 0 ; i<features.length; i++){

    featureArr.push(features[i].geojson);

  }

  res.json(featureArr);

  await pool.end();
});

app.get('/geocode-place', async ( req, res) => {

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });
 
  const userInput = req.query.userInput;

  //TODO: add error handling
  const userLat = parseFloat(req.query.lat);
  const userLon = parseFloat(req.query.lon); 

  var result = null; 
  
  try{
    result = await pool.query(`select geomatch( $1::text , $2::float, $3::float);` , [userInput , userLat , userLon]); 

  }catch(error){ 
    console.log(error); //for some fucking reaosn the above fails --occasionally, no clue why

    result = await pool.query(`select geomatch_fallback( $1::text) as geomatch;` , [userInput]); 
  }

  res.json({result});

  await pool.end();
});

app.get('/get-fire-forecast' , async (req , res) =>{

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  const dbId = req.query.id;

  var result = await pool.query(`select todays_outlook from ${process.env.FIRE_OUTLOOK} outlook where ST_Intersects( outlook.geometry  , (select geometry::geometry from ${process.env.GEOCODE} where id = $1) );` , [dbId] );

  res.json({result});  

  await pool.end();
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`); 
});     