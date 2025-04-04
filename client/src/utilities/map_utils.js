import 'leaflet/dist/leaflet.css'
import "leaflet"
import axios from "axios"
import fireIcon from "../icons/flame.png"
import locationIcon from '../icons/Location/location-icon.png'
import  vectorTileLayer from 'leaflet-vector-tile-layer'

export class layerCarry{
    constructor(obj){
        this.obj = obj;
    }
}      
 
export function initialize_map (id = null, tileUrl = null, attribution = null , minZoom = null , maxBounds = null, zoom = null, center = null){
    var map = null;

    if(id != null){
        map = L.map(id , {zoomDelta : 1, minZoom : minZoom , maxBounds : maxBounds,
            zoom : zoom , center: center , style : { height: "100vh", width: "100vw" } , zoomControl: false});
    }

    var tiles = L.tileLayer(tileUrl, {attribution : attribution});

    return {"tiles": tiles , "map" : map};
}

//WIP will query on bounding box to get large polygon data - dont bother
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
 
//returns marker placable on map
export function getFireIcon(feature, latlng){ 
    return L.marker(latlng , {icon : getFirePic() , riseOnHover : true});

} 

//returning fire img as L.icon - used above
function getFirePic(size = [18,18]){return L.icon({iconUrl : fireIcon , iconSize : size});}

//ios-style location icon png modify L.icon options here
export function getLocationIcon(size = [20,20]){return L.icon({iconUrl : locationIcon , iconSize : size});}

//marker creating function
export function addLocationMarker(map , icon , carrier, latlng , opacity = 1.0){

    var marker = new L.Marker(latlng , {icon : icon , opacity : opacity , interactive : false});

    marker.addTo(map);

    carrier.obj = marker;

    return;
}

export function removeLocationMarker(map , marker){

    if(marker == null){
        return;
    }

    map.removeLayer(marker);
}

//dictates satelite hotspot layer styling, modify here
export function viirsStyle(){ //returns style for viirs data , you make it gets used
     return  {
        color: '#f76605',
        weight: 1.5,
        opacity: 0.7
    };
}

//defines function to be executed on each polygon in hotspot layer on render
function viirsOnEach(feature , layer){

    layer.on('click' , (layer)=>{ featurePopup(layer.target.feature , 'Satelite Hotspot' , layer);});
    
    layer.on('mouseover' , (layer)=>{layer.target.setStyle({weight: 5 , opacity: 0.75})});

    layer.on('mouseout' , (layer)=> layer.target.setStyle(viirsStyle()));
}

//makes request to server
export async function getViirs(apiUrl){ //returns layer 

    var viirsData = await getGeojson(apiUrl + '/viirs-public');
    
    const viirsLayer = L.geoJSON(viirsData , {style : viirsStyle(), onEachFeature : viirsOnEach});

    return viirsLayer;
}

//function to execute on renger of known wildfire points, set event listeners, etc..
function wfigsOnEach(feature, layer){

    layer.on('click' , (layer)=>{ featurePopup(layer.target.feature , 'Known Wildfire' , layer);});

    layer.on('mouseover', (layer)=>{ layer.target.setIcon(getFirePic([25,25]))});

    layer.on('mouseout' , (layer)=>{layer.target.setIcon(getFirePic())});
    
}

//server call
export async function getWfigs(apiUrl){ //returns layer 

    var wfigsData = await getGeojson(apiUrl + '/wfigs-public');

    const wfigsLayer = L.geoJSON(wfigsData , {pointToLayer : getFireIcon , onEachFeature : wfigsOnEach});

    return wfigsLayer;   
}

//turn simple geojson layers on or off, pass the layer itself and the current map object
export function handleSmallLayer(map , layer = null){ 

    if(layer != null && map.hasLayer(layer)){
        map.removeLayer(layer);
    }
    else{
        layer.addTo(map);
    }
} 

//requests and handles on/off for vector tiled public lands data - we may combine public and private
//into one function and let params decide behaviour....
export async function handleFlPublicTiles(map , flConserve , apiUrl){

    var url = apiUrl + '/publicTiles';

    if(!(flConserve.obj instanceof L.Layer)){

        //TODO:break out bounds into config file
        flConserve.obj = vectorTileLayer(url , {s : '' , style : getFlPublicStyle , 
            bounds : L.latLngBounds([24.37942 , -87.753] , [31.5692, -79.585]), updateInterval : 500 , 
            updateWhenZooming : false , minZoom : 6 , interactive : true , zIndex : 4 , maxDetailZoom : 15 
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

//publiclands style - obv
function getFlPublicStyle(feature , layerName , zoom){

    return {fillColor : getFlPublicColors(feature), fillOpacity: .3 , color : '#ebf0f0',  weight : 0.3
        };
}

//color scheme, based on name or managing agency of land polygon
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

//requests and handles on/off for vector tiled private lands data - we may combine public and private
//into one function and let params decide behaviour....
export async function handlePrivateTiles(map , privateLands , apiUrl){

    const url = apiUrl + '/privateTiles';

    if(!(privateLands.obj instanceof L.Layer)){

        //TODO:break out bounds into config file
        privateLands.obj = vectorTileLayer(url , {s : '' , style : getPrivateStyle(), 
            bounds : L.latLngBounds([24.37942 , -87.753] , [31.5692, -79.585]), updateInterval : 500 , 
            updateWhenZooming : false , minZoom : 12 , interactive : true , zIndex : 3 , maxDetailZoom : 16
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
    return {
        color: '#910c12', 
        fill : true  , 
        fillColor : '#ffffff00' , 
        opacity : 1.0 , 
        weight : 1.5
    };
}

//creates tooltip that follows mouse moves on hover of feature
//leaflet supports this with its native tile layers - but not with extensions, so we have to recreate
function handlePrivateLandTooltip(feature , map, privateLands){

    var toolTip =  L.tooltip(feature.latlng , {opacity : .5 , content : (layer)=>{return getPrivateTooltipContent(feature.layer.properties.owner_name);} })

    privateLands.obj.on('mousemove' , (feature)=>{
            toolTip.removeFrom(map);
            toolTip = L.tooltip(feature.latlng , {opacity : .5 , content : (layer)=>{return getPrivateTooltipContent(feature.layer.properties.owner_name);}});
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
        privateLands.obj.off('mousemove'); 
        privateLands.obj.off('mouseout');
        privateLands.obj.off('zoomstart');
     });
}

//returns html element as text that becomes tooltip content
function getPrivateTooltipContent(ownerName){
    return '<div>' +ownerName+'</div>';
}

const keyMap = {
    "CalculatedAcres": ["Acres", 1],
    "ContainmentDateTime": ["Containment DT", 1],
    "ControlDateTime": ["Control DT", 1],
    "DailyAcres": ["Daily Acres", 1],
    "DiscoveryAcres": ["Discovery Acres", 1],
    "Fatalities": ["Fatalities", 1],
    "FinalAcres": ["Final Acres", 1],
    "FireCause": ["Fire Cause", 1],
    "FireCauseGeneral": ["Fire Cause General", 0],
    "FireDiscoveryAge": ["Fire Discovery Age", 0],
    "FireDiscoveryDateTime": ["Fire Discovery DT", 1],
    "FireMgmtComplexity": ["Fire Mgmt Complexity", 0],
    "FireOutDateTime": ["Fire Out DT", 1],
    "GACC": ["G A C C", 0],
    "GlobalID": ["Global ID", 0],
    "ICS209ReportDateTime": ["ICS 209 Report DT", 0],
    "IncidentManagementOrganization": ["Incident Management Organization", 0],
    "IncidentName": ["Incident Name", 0],
    "IncidentTypeCategory": ["Incident Type Category", 0],
    "IncidentTypeKind": ["Incident Type Kind", 0],
    "Injuries": ["Injuries", 1],
    "IrwinID": ["Irwin ID", 0],
    "IsValid": ["Is Valid", 0],
    "ModifiedOnAge": ["Modified On Age", 0],
    "ModifiedOnDateTime": ["Modified On Date Time", 0],
    "OBJECTID": ["Object ID", 0],
    "OtherStructuresDestroyed": ["Other Structures Destroyed", 1],
    "POOCounty": ["POO County", 0],
    "POOState": ["POO State", 0],
    "PercentContained": ["Percent Contained", 1],
    "PredominantFuelGroup": ["Predominant Fuel Group", 0],
    "PredominantFuelModel": ["Predominant Fuel Model", 0],
    "PrimaryFuelModel": ["Primary Fuel Model", 0],
    "ResidencesDestroyed": ["Residences Destroyed", 1],
    "TotalIncidentPersonnel": ["Total Incident Personnel", 1],
    "UniqueFireIdentifier": ["Unique Fire Identifier", 1]
};

function importantKey(key)
{
    if(keyMap.hasOwnProperty(key))
        return keyMap[key][1];

    return 1;
}

function keyTranslate(key){
    if(keyMap.hasOwnProperty(key))
        return keyMap[key][0];

    return key;
}

//generalized function for onclick feature popups
function featurePopup(feature , headerText , layer = null ){ //right now it just runs through all the properties we send over as a dict

    var section = document.getElementById('feature-click-popup');

    var header = document.getElementById('feature-click-header');

    var body = document.getElementById('feature-click-body');

    if(body.hasChildNodes()){while(body.firstChild){body.removeChild(body.lastChild);}}

    header.innerText = headerText;

    for (let key in feature.properties){
        
        if(!importantKey(key))
            continue;

        if(["0", "null", null].includes(feature.properties[key]))
            continue;
        console.log(key)

        var featureAttr = document.createElement('div');
        featureAttr.className = 'flex flex-col text-left p-2';
        featureAttr.id = 'feature-click-attr-'+key;

        let formattedKey = keyTranslate(key);

        var keySpan = document.createElement('span');
        keySpan.className="w-full h-full text-lg font-black"
        keySpan.innerText = formattedKey;

        var valueSpan = document.createElement('span');
        valueSpan.className="w-full h-full text-md"
        valueSpan.innerText =  feature.properties[key];

        featureAttr.appendChild(keySpan);
        featureAttr.appendChild(valueSpan);

        body.appendChild(featureAttr);
    }

    section.style.visibility = 'visible';
    section.style.display = 'block';
    section.style.opacity = 1;
}
