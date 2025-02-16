import 'leaflet'
import { addLayer, getViirs, getWfigs, handleSmallLayer, initialize_map } from "./map_utils.js"
import './styles.css'

const mapBounds = L.latLngBounds([[-20 , 0], [ 90,-180]]) //use for us mapbounds
const minZoom = 4
const zoomStart = 7
const apiUrl = 'http://localhost:4242' //adjust

var mapCenter = [30.4383, -84.2807] //we adjust to be the user's location

//map instance with satelite baselayer and appropriate bounds
const initMap = initialize_map('map' , 
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' , 
    'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    minZoom,
    mapBounds,
    zoomStart,
    mapCenter
);

const map = initMap.map;   
const esriTiles = initMap.tiles;

const viirsLayer = await getViirs(apiUrl);
const wfigsLayer = await getWfigs(apiUrl);

document.getElementById('viirs').addEventListener('click', ()=>{handleSmallLayer(map ,viirsLayer);});   
document.getElementById('wfigs').addEventListener('click' , ()=>{handleSmallLayer(map , wfigsLayer)})