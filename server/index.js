require('dotenv').config();
const express = require('express'); 
const compression = require('compression');
const dayjs = require('dayjs');
const neon = require('@neondatabase/serverless');
var customFormat = require('dayjs/plugin/customParseFormat');
dayjs().format();
dayjs.extend(customFormat);

const cors = require('cors');
const app = express();
app.use(express.json());
app.use(compression({filter : (req , res)=>{return true;} , level : 3}));

app.use(express.urlencoded({extended : true}));
   
app.use(cors({
  origin: "http://127.0.0.1:5500", // Adjust if using a different frontend port
  credentials: true // Required for sending cookies
})); 

const PORT = process.env.PORT || 4242; //MODIFY when hosted

app.get('/viirs-public', async (_, res) => {

  var conn = null;

  try{
    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    console.log("Error connecting to the Neon Database")
    res.status(500);
    res.send(error);
    return;
  }

  var result = null;
  
  try{
    result = await conn(`select * from ${process.env.VIIRSPUBLIC};`);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  res.json(result[0]);
});
  
app.get('/wfigs-public', async (_, res) => {

  var conn = null;

  try{

    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  var result = null;

  try{
    result = await conn(`select * from ${process.env.WFIGSPUBLIC};`);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }
  
  res.json(result[0]);
}); 

app.get('/geocode-place', async ( req, res) => {

  var conn = null;

  try{

    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }
 
  const userInput = req.query.userInput; //sanitize

  //TODO: add error handling
  try{
    var userLat = parseFloat(req.query.lat);
    var userLon = parseFloat(req.query.lon); 

    if(isNaN(userLat) || isNaN(userLon)){
      throw new Error('invalid lat/lon');
    }
  }
  catch(error){
    res.status(400);
    res.send(error.message);
    return;
  }

  var result = null; 

  try{

    result = await conn(`select public.geomatch( $1::text , $2::float, $3::float);` , [userInput , userLat , userLon]); 

  }catch(error){
    res.status(500);
    res.send();
    return;
  }
  
  res.set('Cache-Control', 'public, max-age=60');
  res.json(result);
});

app.get('/get-fire-forecast' , async (req , res) =>{

  var conn = null;

  try{

    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  const dbId = req.query.id;

  var result = null;

  try{

    result = await conn(`select date , day_1 , day_2 , day_3 , day_4 , day_5 , day_6 , day_7 from ${process.env.FIRE_OUTLOOK} outlook where ST_Intersects( outlook.geometry  , (select geometry::geometry from ${process.env.GEOCODE} where id = $1) ) limit 1;` , [dbId] );
  }
  catch(error){
    res.status(500);
    res.send(); 
    return; 
  }

  var forecast = result[0];

  startDate = new dayjs(result[0]['date'] , 'YYYY-MM-DD');

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
});

app.get('/publicTiles' , async (req , res) =>{

  var conn = null;

  try{

    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  try{

    var x = parseInt(req.query.x); //TODO: error handling
    var y = parseInt(req.query.y);
    var z = parseInt(req.query.z);

    if(isNaN(x) || isNaN(y) || isNaN(z)){
      throw new Error('invalid tile query');
    }
  }
  catch(error){
    res.status(400);
    res.send(error.message);
    return;
  }

  var simplify = null;

  switch(true){
    case z < 10:
      simplify = 600;
      break;
    case z >= 10 && z < 12:
      simplify = 300; 
      break;
    case z == 12:
      simplify = 100;
      break;
    case z > 12 && z <= 13:
      simplify = 50
      break;
    case z > 13 && z <= 14:
      simplify = 25;
      break;
    case  z > 14:
      simplify = 0;
      break;
    default:
      simplify = 25;
      break;
  }

  var tile = null;

  try{
    
    tile = await conn('select public.getPublicLandsTile($1::int , $2::int , $3::int , $4::real);' , [x,y,z , simplify]);

  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  res.set('Cache-Control', 'public, max-age=60');
  res.send(tile[0].getpubliclandstile);

});
 
app.get('/privateTiles' , async (req , res) =>{

  var conn = null;

  try{

    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  try{

    var x = parseInt(req.query.x); //TODO: error handling
    var y = parseInt(req.query.y);
    var z = parseInt(req.query.z);

    if(isNaN(x) || isNaN(y) || isNaN(z)){
      throw new Error('invalid tile query');
    }
  }
  catch(error){
    res.status(400);
    res.send(error.message);
    return;
  }

  var acresGreaterThan = null;
  var simplify = null;

  switch(true){
    case z >= 12 && z < 13:
      acresGreaterThan = 100;
      simplify = 100;
      break;
    case z >= 13 && z <= 14:
      acresGreaterThan = 20;
      simplify = 5;
      break;
    case z > 14 && z < 15: 
      acresGreaterThan = 1;
      simplify = 0
      break;
    case z >= 15 && z < 17: 
      acresGreaterThan = 1;
      simplify = 0;
      break;
    case z >= 17:
      acresGreaterThan = 0;
      simplify = 0
      break;
    default:
      acresGreaterThan = 0; 
      simplify = 0;
  }

  var tile = null;

  try{
    tile = await conn('select public.getPrivateLandsTile($1::int , $2::int , $3::int , $4::int , $5::int)' , [x,y,z , simplify, acresGreaterThan]);
  }
  catch(eror){
    res.status(500);
    res.send();
    return;
  }

  res.set('Cache-Control', 'public, max-age=60');
  res.send(tile[0].getprivatelandstile);  
});

app.get('/get-fires-near-me', async (req, res) => {

  var conn = null;

  try{

    conn = neon.neon(process.env.DATABASE_URL);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  try{

    var queryLat = parseFloat(req.query.lat);
    var queryLon = parseFloat(req.query.lon); 
    var radius = parseInt(req.query.distance); // in miles

    if(isNaN(queryLat) || isNaN(queryLon) || isNaN(radius)){
      res.status(400);
      res.send('invalid lat/lon');
      return;
    }
  }
  catch(error){
    res.status(400);
    res.send(error.message);
    return;
  }

  var wildfires = null;
  var hotspots = null;

  try{
    wildfires = await conn( 'select * from public.wildfiresNearMe($1::float , $2::float , $3::int)', [queryLat, queryLon, radius]);
    hotspots = await conn( 'select * from public.hotspotsNearMe($1::float , $2::float , $3::int)', [queryLat, queryLon, radius]);
  }
  catch(error){
    res.status(500);
    res.send();
    return;
  }

  res.json({
    'wildfires': wildfires,
    'hotspots': hotspots
  });
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`); 
});     