require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const dayjs = require('dayjs');
var customFormat = require('dayjs/plugin/customParseFormat');
dayjs().format();
dayjs.extend(customFormat);

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

  const rows = result.rows 

  res.json({ rows });

  client.release();   
});
  
app.get('/wfigs-public', async (_, res) => {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();
  const result = await client.query(`select * from ${process.env.WFIGSPUBLIC};`);
  
  const rows = result.rows 

  res.json({ rows });
 
  client.release(); 
}); 

app.get('/fl_conservation-public', async (req, res) => {

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
 

  const client = await pool.connect();

  result = await client.query(`select geojson from ${process.env.FLCONSERVEPUBLIC};`);
  
  const features = result.rows 

  var featureArr = [];

  for(var i = 0 ; i<features.length; i++){

    featureArr.push(features[i].geojson);

  }

  res.json(featureArr);

  client.release(); 

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

  const client = await pool.connect();

  try{

    var thresh = client.query('SET pg_trgm.similarity_threshold = 0.1;');

    result = await client.query(`select geomatch( $1::text , $2::float, $3::float);` , [userInput , userLat , userLon]); 

  }catch(error){ 
    console.log(error); //for some fucking reaosn the above fails --occasionally, no clue why
    console.log(userInput);  
    result = await client.query(`select geomatch_fallback( $1::text) as geomatch;` , [userInput]); 
  }
 
  res.json({result});

  await client.release(); 

  await pool.end(); 
});

app.get('/get-fire-forecast' , async (req , res) =>{

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  const dbId = req.query.id;

  const client = await pool.connect();

  var result = await client.query(`select date , day_1 , day_2 , day_3 , day_4 , day_5 , day_6 , day_7 from ${process.env.FIRE_OUTLOOK} outlook where ST_Intersects( outlook.geometry  , (select geometry::geometry from ${process.env.GEOCODE} where id = $1) ) limit 1;` , [dbId] );

  var forecast = result.rows[0];

  startDate = new dayjs(result.rows[0]['date'] , 'YYYY-MM-DD');

  delete forecast.date;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var forecast_values = {};

  forecast_values['forecast_date'] = startDate.format('YYYY/MM/DD');

  forecast_values['weeklyForecast'] = {};

  for (let key in forecast){

    daySpecificForecast = {};

    daySpecificForecast['forecast'] = forecast[key];

    daySpecificForecast['weekDay'] = days[startDate.day()];

    daySpecificForecast['dayOfMonth'] = startDate.format('DD')

    forecast_values['weeklyForecast'][key] = daySpecificForecast;

    startDate = startDate.add(1 , 'day');
  }


  res.json(forecast_values);  


  await client.release();
  await pool.end();
});

app.get('/publicTiles' , async (req , res) =>{

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  var x = parseInt(req.query.x); //TODO: error handling
  var y = parseInt(req.query.y);
  var z = parseInt(req.query.z);

  var simplify = null;

  switch(true){
    case z < 10:
      simplify = 400;
      break;
    case z <= 12:
      simplify = 200;
      break;
    case z > 12 && z <= 13:
      simplify = 100
      break;
    case z > 13 && z <= 14:
      simplify = 50;
      break;
    case  z > 14:
      simplify = 0;
      break;
  }

  const tile = await pool.query('select getPublicLandsTile($1::int , $2::int , $3::int , $4::real);' , [x,y,z , simplify]);

  res.send(tile.rows[0].getpubliclandstile);

  pool.end();

})

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`); 
});     