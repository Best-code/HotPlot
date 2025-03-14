import 'leaflet/dist/leaflet.css'
import "leaflet"
import axios from "axios"
import fireIcon from "../icons/flame.png"
import { bounds, noConflict } from 'leaflet'; 
import  vectorTileLayer from 'leaflet-vector-tile-layer'

export class layerCarry{
    constructor(obj){
        this.obj = obj;
    }
}      
 
export function initialize_map (id , tileUrl , attribution , minZoom , maxBounds , zoom , center){
    var map = L.map(id , {zoomDelta : 0.5, minZoom : minZoom , maxBounds : maxBounds,
        zoom : zoom , center: center , style : { height: "100vh", width: "100vw" } , zoomControl: false});

    var tiles = L.tileLayer(tileUrl, {attribution : attribution});

    tiles.addTo(map);

    return {"tiles": tiles , "map" : map};
}

//WIP will query on bounding box to get large polygon data
export async function getGeojson(url , bounded = false, boundingBox = null){ //specify bounding box for spatial query based on current map bounds -- not supported 
    if(!bounded){
        var features = await axios.get(url); 
    }
    else{
        var features = await axios.get(url , {params : boundingBox});
    }

    if(!bounded){

        var features = features.data.geojson;
        
        return features;
    }
    else{
        return features.data;
    }
}
 
export function getFireIcon(feature, latlng){ 
    return L.marker(latlng , {icon : getFirePic() , riseOnHover : true});

} 

function getFirePic(size = [18,18]){return L.icon({iconUrl : fireIcon , iconSize : size})}
 
export function viirsStyle(){ //returns style for viirs data , you make it gets used
     return  {
        color: '#d61313',
        weight: 1.5,
        opacity: 0.5
    };
}

function viirsOnEach(feature , layer){

    layer.on('click' , (layer)=>{ featurePopup(layer.target.feature , 'Satelite Hotspot' , layer);});
    
    layer.on('mouseover' , (layer)=>{layer.target.setStyle({weight: 5 , opacity: 0.75})});

    layer.on('mouseout' , (layer)=> layer.target.setStyle(viirsStyle()));
}

export async function getViirs(apiUrl){ //returns layer 

    var viirsData = await getGeojson(apiUrl + '/viirs-public');
    
    const viirsLayer = L.geoJSON(viirsData , {style : viirsStyle(), onEachFeature : viirsOnEach});

    return viirsLayer;
}

function wfigsOnEach(feature, layer){

    layer.on('click' , (layer)=>{ featurePopup(layer.target.feature , 'Known Wildfire' , layer);});

    layer.on('mouseover', (layer)=>{ layer.target.setIcon(getFirePic([21,21]))});

    layer.on('mouseout' , (layer)=>{layer.target.setIcon(getFirePic())});
    
}

export async function getWfigs(apiUrl){ //returns layer 

    var wfigsData = await getGeojson(apiUrl + '/wfigs-public');

    const wfigsLayer = L.geoJSON(wfigsData , {pointToLayer : getFireIcon , onEachFeature : wfigsOnEach});

    return wfigsLayer;   
}

export function handleSmallLayer(map , layer = null){ 

    if(layer != null && map.hasLayer(layer)){
        map.removeLayer(layer);
    }
    else{
        layer.addTo(map);
    }
} 

export async function handleFlPublicTiles(map , flConserve , apiUrl){

    var url = apiUrl + '/publicTiles';

    if(!(flConserve.obj instanceof L.Layer)){

        //TODO:break out bounds into config file
        flConserve.obj = vectorTileLayer(url , {s : '' , style : getFlPublicStyle , 
            bounds : L.latLngBounds([24.37942 , -87.753] , [31.5692, -79.585]), updateInterval : 500 , 
            updateWhenZooming : false , minZoom : 8 , interactive : true 
        });

        flConserve.obj.on('click' , (feature)=>{featurePopup(feature.layer , 'Fl Public Lands');})

        flConserve.obj.addTo(map);
    }
    else if(flConserve.obj instanceof L.Layer){

        if(!(map.hasLayer(flConserve.obj))){
            flConserve.obj.addTo(map);
        }
        else{
            map.removeLayer(flConserve.obj);
        }
    }
}

function getFlPublicStyle(feature , layerName , zoom){

    return {fillColor : getFlPublicColors(feature), fillOpacity: .3 , color : '#ebf0f0',  weight : 0.2
        };
}

function getFlPublicColors(feature){
    switch(true){
        case feature.properties.name.includes('Wildlife Management Area') : return '#4ce6ba';
        case feature.properties.name.includes('WMA') : return '#4ce6ba';
        case feature.properties.name.includes('National Park') : return '#121d7a';
        case feature.properties.name.includes('State Park') : return '#0b21db';
        case feature.properties.name.includes('State Forest') : return '#12de45';
        case feature.properties.name.includes('National Forest') : return '#5f9c4c';
        case feature.properties.name.includes('Water Management') : return '#5ccacc';
        case feature.properties.managing_agency_type.includes('Federal') : return '#74992e';
        case feature.properties.managing_agency_type.includes('Local') : return '#deb773';
        case feature.properties.managing_agency_type.includes('State') : return '#2fa8d4';
    }
}

export async function handlePrivateTiles(map , privateLands , apiUrl){

    const url = apiUrl + '/privateTiles';

    if(!(privateLands.obj instanceof L.Layer)){

        //TODO:break out bounds into config file
        privateLands.obj = vectorTileLayer(url , {s : '' , style : getPrivateStyle(), 
            bounds : L.latLngBounds([24.37942 , -87.753] , [31.5692, -79.585]), updateInterval : 500 , 
            updateWhenZooming : false , minZoom : 12 , interactive : true 
        });

        privateLands.obj.on('click' , (feature)=>{featurePopup(feature.layer , 'Fl Private Lands');})

        privateLands.obj.on('mouseover' , (feature)=>{ handlePrivateLandTooltip(feature , map , privateLands); });

        privateLands.obj.addTo(map);
    }
    else if(privateLands.obj instanceof L.Layer){

        if(!(map.hasLayer(privateLands.obj))){
            privateLands.obj.addTo(map);
        }
        else{
            map.removeLayer(privateLands.obj);
        }
    }
}

function getPrivateStyle(){
    return {color: '#910c12', 
        fill : true  , 
        fillColor : '#ffffff00' , 
        opacity : 1.0 , 
        weight : 1} 
}

function handlePrivateLandTooltip(feature , map, privateLands){
    var toolTip =  L.tooltip(feature.latlng , {opacity : .5}).setContent(feature.layer.properties.owner_name);

    privateLands.obj.on('mousemove' , (feature)=>{
            toolTip.removeFrom(map);
            toolTip = L.tooltip(feature.latlng , {opacity : .5}).setContent(feature.layer.properties.owner_name);
            map.openTooltip(toolTip);

    });

    function remov(feature){
        toolTip.removeFrom(map); 
        privateLands.obj.off('mousemove'); 
        privateLands.obj.off('mouseout');
        privateLands.obj.off('zoomstart');
        map.off('zoomstart' , remov);
    }

    map.on('zoomstart', remov);

    privateLands.obj.on('mouseout' , (feature)=>{
        toolTip.removeFrom(map); 
        map.off('zoomstart' , remov);
        toolTip = null; 
        privateLands.obj.off('mousemove'); 
        privateLands.obj.off('mouseout');
        privateLands.obj.off('zoomstart');
     });
}

function featurePopup(feature , headerText , layer = null ){ //right now it just runs through all the properties we send over as a dict

    var section = document.getElementById('feature-click-popup');

    var header = document.getElementById('feature-click-header');

    var body = document.getElementById('feature-click-body');

    if(body.hasChildNodes()){while(body.firstChild){body.removeChild(body.lastChild);}}

    header.innerText = headerText;

    for (let key in feature.properties){
        
        var featureAttr = document.createElement('div');
        featureAttr.className = 'feature-click-attr';
        featureAttr.id = 'feature-click-attr-'+key;

        featureAttr.style.height = '70px';
        featureAttr.style.width = '100%';

        featureAttr.innerText = key + ' ' +feature.properties[key];


        body.appendChild(featureAttr);
    }

    section.style.visibility = 'visible';
    section.style.display = 'block';
    section.style.opacity = 1;
}
