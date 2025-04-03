import 'leaflet'
import { layerCarry , getViirs, getWfigs, handleSmallLayer, initialize_map, handleFlPublicTiles, handlePrivateTiles, addLocationMarker , getLocationIcon , removeLocationMarker} from "./utilities/map_utils.js"
import './styles.css'
import { geoWrap , getUserCoords, onLoad, handleSearch, } from './utilities/utils.js'

//eliminates flashing of unstyled components -- could use SSR to fix but this works
window.onload = onLoad;

const mapBounds = L.latLngBounds([[-20 , 0], [ 90,-180]]); //use for us mapbounds
const minZoom = 4;
const zoomStart = 4;   
const apiUrl = 'http://localhost:4242'; //adjust   
const defCenter = [32,-80]; //about the cente rof the us, starting value if geoloc is declined

const locationIcon = new layerCarry(getLocationIcon([40,40])); //consistent style across iterations


/*this global will change based on whatever location marker is currently placed on the map , 
defaulting to wherever the userlocation is , or, if null then nowhere*/
var locationMarker = new layerCarry(null); 

//map instance with satelite baselayer and appropriate bounds

document.getElementById('viirs-desc').innerText = 'Possible Wildfires';
document.getElementById('wfigs-desc').innerText = 'Current Wildfires';
document.getElementById('fl-conserve-desc').innerText = 'FL Public Lands';
document.getElementById('fl-private-desc').innerText = 'FL Private Lands';

const satMap = initialize_map('map' , 
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' , 
    'Tiles &copy; Esri and the GIS User Community',
    minZoom, 
    mapBounds,
    zoomStart,
    defCenter
);

const transitMap = initialize_map(null, 
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    'Tiles &copy; Esri and the GIS User Community'
);

const map = satMap.map;  
const esriTiles = satMap.tiles;
const transitTiles = transitMap.tiles;

esriTiles.addTo(map); //adds satelite base to map as the default

map.on('dragstart' , ()=>{document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while(results.length > 0){results[0].remove();}});

//sets map to initial user locaion and allows for snapping to user position from navbar
map.on('locationfound' , (locationEvent)=>{map.setView(locationEvent.latlng , 11); removeLocationMarker(map, locationMarker.obj); addLocationMarker(map , locationIcon.obj , locationMarker , locationEvent.latlng);});

//hoestly may drop the below section to just use the leaflet api instead of making a new request
var userLocation = new geoWrap(null);

map.locate({maximumAge : 600000}); //sets map to userlocation if approved

//try and get user location 
getUserCoords(userLocation);

//get geolocal search results if possible
document.getElementById('search-input').addEventListener("keystopped" , ()=>{
    if(userLocation.obj instanceof GeolocationPosition){handleSearch(userLocation.obj.coords.latitude , userLocation.obj.coords.longitude , apiUrl , map ,  locationMarker , locationIcon.obj)}
    else{const center = map.getCenter();  handleSearch(center.lat , center.lng , apiUrl , map , locationMarker , locationIcon.obj)}});


//navbar events
document.getElementById('zoom-in').addEventListener('click' , ()=>{map.zoomIn(1);});
document.getElementById('zoom-out').addEventListener('click' , ()=>{map.zoomOut(1);});
document.getElementById('locate-me').addEventListener('click' , ()=>{map.locate(600000);});
//end navbar events

//loaded smaller geojson based layers on page load but not placed on map
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
// document.getElementById('result-popup-close').addEventListener('click' , ()=>{
//     // var infoBox = document.getElementById('result-info-popup'); 
//     // infoBox.style.height = 0; infoBox.style.visibility = 'hidden';
//      if(locationMarker.obj instanceof L.Marker){removeLocationMarker(map , locationMarker.obj);}});
document.querySelectorAll('.basemap').forEach( element => {element.addEventListener('click' , (event)=>{

    var selectors = document.getElementsByClassName('basemap');

    for(var i = 0 ; i < selectors.length ; i++){

        if(selectors[i].checked){
            selectors[i].checked = false;
        }
    }

    event.target.checked = true;

    if(event.target.id == 'satellite'){
        map.removeLayer(transitTiles);
        map.addLayer(esriTiles);
    }
    else if(event.target.id == 'streets'){
        map.removeLayer(esriTiles);
        map.addLayer(transitTiles);
    }

})});
