
import 'leaflet'
import { addLayer, getFireIcon, getGeojson, initialize_map } from "./map_utils.js"
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

var viirsStyle = {
    color: '#d61313',
    weight: 2,
    opacity: 0.65
};

//turned off for css styling to not use egress data cap
//var viirsData = await getGeojson(apiUrl + '/viirs-public');

//var wfigsData = await getGeojson(apiUrl + '/wfigs-public');

//DO NOT TURN THIS SHIT ON, ITS 150MB to load once and we only have 5GB of egress on free
//its kinda sick tho
//var flConserve = await getGeojson(apiUrl + '/fl_conservation-public')

const viirsLayer = L.geoJSON(viirsData , {style : viirsStyle});

addLayer(map , viirsLayer);

const wfigsLayer = L.geoJSON(wfigsData , {pointToLayer : getFireIcon});

wfigsLayer.addTo(map);

/*const flConserveLayer = L.geoJSON(flConserve , {weight : .25  , style : function (feature){
    switch (feature.properties.MATYPE2){
        case 'Federal' : return {color : '#74992e'};
        case 'State' : return {color : '#03b6fc'};
        case 'Local' : return {color : '#8a6436'};
    }
}});*/

//flConserveLayer.addTo(map);