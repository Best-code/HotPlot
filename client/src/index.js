import 'leaflet'
import { layerCarry ,handleFlConserve, getViirs, getWfigs, handleSmallLayer, initialize_map, handleFlPublicTiles, handlePrivateTiles} from "./utilities/map_utils.js"
import './styles.css'
import { geoWrap , getUserCoords, onLoad, handleSearch, } from './utilities/utils.js'

//eliminates flashing of unstyled components -- could use SSR to fix but this works
window.onload = onLoad;

const mapBounds = L.latLngBounds([[-20 , 0], [ 90,-180]]); //use for us mapbounds
const minZoom = 4;
const zoomStart = 4;   
const apiUrl = 'http://localhost:4242'; //adjust   
const usCenter = [38,-100]; //about the cente rof the us, starting value if geoloc is declined

//map instance with satelite baselayer and appropriate bounds

document.getElementById('viirs-desc').innerText = 'Possible Wildfires';
document.getElementById('wfigs-desc').innerText = 'Current Wildfires';
document.getElementById('fl-conserve-desc').innerText = 'FL Public Lands';
document.getElementById('fl-private-desc').innerText = 'FL Private Lands';

const initMap = initialize_map('map' , 
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' , 
    'Tiles &copy; Esri and the GIS User Community',
    minZoom, 
    mapBounds,
    zoomStart,
    usCenter
);  

const map = initMap.map;  
const esriTiles = initMap.tiles;

map.on('dragstart' , ()=>{document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while(results.length > 0){results[0].remove();}});
map.locate({setView: true, maxZoom: 10}); //sets map to userlocation if approved

var userLocation = new geoWrap(null);

//try and get user location and set map center to it
getUserCoords(userLocation , map);

//get geolocal search results if possible
document.getElementById('search-input').addEventListener("keystopped" , ()=>{
    if(userLocation.obj instanceof GeolocationPosition){handleSearch(userLocation.obj.coords.latitude , userLocation.obj.coords.longitude , apiUrl , map)}
    else{const center = map.getCenter();  handleSearch(center.lat , center.lng , apiUrl , map)}});

//loaded on page load but not placed on map
var viirsLayer = null;
var wfigsLayer = null;

try{
    viirsLayer = await getViirs(apiUrl);
}catch(error){}

try{
    wfigsLayer = await getWfigs(apiUrl);
}catch(error){}

//deals with passing stuff to js fuctions, we need the layer saved in the global scope so we can remove, which
//requires it be mutatable by functions, ergo the wrapper class
var flConserve = new layerCarry(null); 
var privateLands = new layerCarry(null);


document.getElementById('fl-conserve').addEventListener('click' , ()=>{handleFlPublicTiles(map , flConserve , apiUrl);});
document.getElementById('viirs').addEventListener('click', ()=>{handleSmallLayer(map ,viirsLayer);});   
document.getElementById('wfigs').addEventListener('click' , ()=>{handleSmallLayer(map , wfigsLayer)});
document.getElementById('fl-private').addEventListener('click' , ()=>{handlePrivateTiles(map , privateLands , apiUrl)});