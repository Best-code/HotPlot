import 'leaflet'
import { layerCarry ,handleFlConserve, getViirs, getWfigs, handleSmallLayer, initialize_map} from "./map_utils.js"
import './styles.css'
import { geoWrap , geoSearch, getUserCoords, onLoad, handleSearch } from './utils.js'

//eliminates flashing of unstyled components -- could use SSR to fix but this works
window.onload = onLoad;

const mapBounds = L.latLngBounds([[-20 , 0], [ 90,-180]]) //use for us mapbounds
const minZoom = 4
const zoomStart = 7      
const apiUrl = 'http://localhost:4242' //adjust   

var mapCenter = [39.4383, -84.2807] //we adjust to be the user's location

//map instance with satelite baselayer and appropriate bounds

document.getElementById('viirs-desc').innerText = 'Possible Wildfires';
document.getElementById('wfigs-desc').innerText = 'Current Wildfires';
document.getElementById('fl-conserve-desc').innerText = 'FL Public Lands';

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

var userLocation = new geoWrap(null);

//try and get user location and set map center to it
getUserCoords(userLocation , map);

var mapCenter = null; //maintained as current center of the map. Use for location search if location service declined?
map.on("dragend" , ()=>{mapCenter = map.getCenter()} );

//if we have search results visible we remove them from view when map dragged
map.on("dragstart" , ()=>{var results = document.getElementsByClassName('search-result'); for(var i =0;i<results.length;i++){results[i].style.visibility = 'hidden';}})

//get geolocal search results if possible , if not we just use the cente rof the map
document.getElementById('search-input').addEventListener("keystopped" , ()=>{
    if(userLocation.obj instanceof GeolocationPosition){handleSearch(userLocation.obj.coords.latitude , userLocation.obj.coords.longitude , apiUrl)}
    else{const center = map.getCenter();  handleSearch(center.lat , center.lng , apiUrl , map)}});

//loaded on page load but not placed on map
const viirsLayer = await getViirs(apiUrl);
const wfigsLayer = await getWfigs(apiUrl);

//deals with passing stuff to js fuctions, we need the layer saved in the global scope so we can remove, which
//requires it be mutatable by functions, ergo the wrapper class
var flConserve = new layerCarry(null); 

document.getElementById('fl-conserve').addEventListener('click' , ()=>{handleFlConserve(map , flConserve , apiUrl)});
document.getElementById('viirs').addEventListener('click', ()=>{handleSmallLayer(map ,viirsLayer);});   
document.getElementById('wfigs').addEventListener('click' , ()=>{handleSmallLayer(map , wfigsLayer)});