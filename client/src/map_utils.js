import 'leaflet/dist/leaflet.css'
import "leaflet"
import axios from "axios"
import fireIcon from "./flame.png"
import { noConflict } from 'leaflet';


export function initialize_map (id , tileUrl , attribution , minZoom , maxBounds , zoom , center){
    var map = L.map(id , {zoomDelta : 0.25, minZoom : minZoom , maxBounds : maxBounds,
        zoom : zoom , center: center , style : { height: "100vh", width: "100vw" } , zoomControl: false});

    var tiles = L.tileLayer(tileUrl, {attribution : attribution});

    tiles.addTo(map);

    return {"tiles": tiles , "map" : map};
}

//TODO: enable querying for fl public lands on bounding box data - work out how to make efficient + user friendly
//WIP will query on bounding box to get large polygon data
export async function getGeojson(url , flag = false, boundingBox = null){ //specify bounding box for spatial query based on current map bounds -- only supported where applicable 
    if(!flag){
        var features = await axios.get(url); 
    }
    else{
        var features = await axios.get(url /*+ '/' + String(boundingBox)*/);
    }

    if(!flag){
        var features = features.data.rows[0].geojson;
    }
    else{

        return features.data.featureArr;
    }

    return features;
}

export function addLayer(map , layer){
    return layer.addTo(map);
}

export function removeLayer(map , layer){
    return map.removeLayer(layer);
}
 
export function getFireIcon(feature, latlng){ 
    return L.marker(latlng , {icon : L.icon({iconUrl : fireIcon , iconSize : [12,12]})});
}

export function viirsStyle(){ //returns style for viirs data , you make it gets used
     return  {
        color: '#d61313',
        weight: 2,
        opacity: 0.65
    };
}

export async function getViirs(apiUrl){ //returns layer 
    var viirsData = await getGeojson(apiUrl + '/viirs-public');
    
    const viirsLayer = L.geoJSON(viirsData , {style : viirsStyle()});

    return viirsLayer;
}

export async function getWfigs(apiUrl){ //returns layer 
    var wfigsData = await getGeojson(apiUrl + '/wfigs-public');

    const wfigsLayer = L.geoJSON(wfigsData , {pointToLayer : getFireIcon});

    return wfigsLayer;
}

export async function getFlConserve(apiUrl , boundingBox = null){ // returns layer
    var flConserve = await getGeojson(apiUrl + '/fl_conservation-public' , true)

    const flConserveLayer = L.geoJSON(flConserve , {weight : .25  , style : function (feature){
        switch (feature.properties.MATYPE2){
            case 'Federal' : return {color : '#74992e'};
            case 'State' : return {color : '#03b6fc'};
            case 'Local' : return {color : '#8a6436'};
        }
    }});

    return flConserveLayer;
}

export function handleSmallLayer(map , layer = null){ //returns layer added or removed

    if(layer != null && map.hasLayer(layer)){
        map.removeLayer(layer);
    }
    else{
        layer.addTo(map);
    }
}