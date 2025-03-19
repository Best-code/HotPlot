import axios from "axios"
import mIcon from "../icons/M.png"
import DIcon from "../icons/D.png"
import VDIcon from "../icons/VD.png"
import { addLocationMarker, getLocationIcon, removeLocationMarker } from "./map_utils";

export function onLoad(){ //simply to render tailwind componeents visible after the rendering completes , stop event propogationfullout on elements, etc..
    document.getElementById('search-bar').style.visibility = 'visible';
    document.getElementById('result-info-popup').style.visibility = 'visible';

    (function(){ //prevents sending a shitton of requests on every keystroke with a new event credit: Kelderic on stackoverflow
        var keystoppedTimer = null;

        var keystoppedInputs = document.getElementsByTagName('input');

        for (var i = 0, l = keystoppedInputs.length; i < l; i++){

            keystoppedInputs[i].addEventListener('keydown', function(event){

                clearTimeout(keystoppedTimer);

                keystoppedTimer = setTimeout(function(){

                    event.target.dispatchEvent( new Event('keystopped') );
                }, 300);
            }, false);
        }
    }());

    //if we have search results visible we remove them from view when map dragged/ focus out/etc
    document.getElementById('hotplot-logo0').addEventListener('click' , ()=>{window.location.reload();});
    document.getElementById('body').addEventListener("click" , ()=>{document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while(results.length > 0){results[0].remove();}});
    document.getElementById('search-input').addEventListener('blur' ,()=>{document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while(results.length >0){results[0].remove();}} , {} );
    document.getElementById('feature-popup-close').addEventListener('click' , ()=>{var popupSection = document.getElementById('feature-click-popup'); popupSection.style.opacity = 0; popupSection.style.visibility = 'hidden';});
}    
//location passed as [lat , lon] 
export async function geoSearch(userEntry , apiUrl , location = [32.0 , -84.0]){ // takes a string and tries to match it to a place name in db

    const searchResult = await axios.get(apiUrl + '/geocode-place' , 
            {params : {"userInput" : userEntry , "lat" : location[0] , "lon" : location[1]}} );

    return searchResult.data;
}

export async function getFireForecast( databaseId,  apiUrl){
    
    const forecast = await axios.get(apiUrl + '/get-fire-forecast'  , {params : { "id" : databaseId}});


    return forecast.data;
}

export class geoWrap{
    constructor(obj){obj = this.obj;}
}

function parseGeoMatch(tuple){ //expects a tuple formatted in the style that the postgres 'GeoMatch' function returns - or the /geosearch route returns - gives arr
    
    const strippedTuple = tuple.replace(/[()]+/g , '');

    var tupArr = strippedTuple.split(',');

    for(var i =0;i<tupArr.length;i++){
        tupArr[i] = tupArr[i].replace(/["]+/g , '');
        tupArr[i] = tupArr[i].trim();
    }

    return tupArr;
}

export function getUserCoords(mutate){ // mutates carrier class passed in to have user coords in .obj or does nothing on failure

    if( ! ('geolocation' in navigator)){return;}

    navigator.geolocation.getCurrentPosition((position)=>{mutate.obj = position;} , (error)=>{return;} , {maximumAge : 90000} );

    return;
}

//through this function, the database id # for the record shown in any div on screen is stored as the 
//"db-id" attribute and can be retrieved on click of that element
export async function handleSearch(lat , lon , apiUrl , map , locationMarker , locationIcon){

    const userInput = document.getElementById('search-input').value;

    if(userInput.length < 0){
        return;
    }
    else{
        
        var UseDefault = false;

        var searchResults = null;

        try{lat = parseFloat(lat); lon = parseFloat(lon)}catch(error){UseDefault=true;}

        if(UseDefault){searchResults = await geoSearch(userInput, apiUrl );}else{searchResults = await geoSearch(userInput , apiUrl , [lat , lon]);}

        const resultBox = document.getElementById('search-result-div');
        
        if(searchResults.length == 0){

            try{
                var results = document.getElementsByClassName('search-result');

                while(results.length > 0){results[0].remove()};

                return;
            }catch(error){return};
        }

        var newDiv = null;

        for(var i = 0; i < searchResults.length; i++){
            

            if(document.getElementById('result' + (i)) == null){

                newDiv = document.createElement('div');
            
                newDiv.id = 'result' + (i);

                newDiv.className = 'search-result'

                resultBox.appendChild(newDiv);

                const geomatchArr = parseGeoMatch(searchResults[i].geomatch);

                newDiv.innerText = geomatchArr[1] + ', ' + geomatchArr[2] + ',  ' + geomatchArr[3] + ' County';


                newDiv.setAttribute("db-id" , geomatchArr[0]) //set to database id for object for qury of the DB on click of div
                newDiv.setAttribute('lat' , geomatchArr[6]);
                newDiv.setAttribute('lon' , geomatchArr[7]);

                newDiv.addEventListener('mousedown' , (event)=>{searchClick(event , apiUrl , map , locationMarker , locationIcon);}) //TODO:implement
            }
            else{

                var searchElement = document.getElementById('result' + i)

                const geomatchArr = parseGeoMatch(searchResults[i].geomatch);

                searchElement.innerText = geomatchArr[1] + ', ' + geomatchArr[2] + ',  ' + geomatchArr[3] + ' County';

                searchElement.setAttribute("db-id" , geomatchArr[0]); //updates db id on new search result taking its place
                searchElement.setAttribute('lat' , geomatchArr[6]);
                searchElement.setAttribute('lon' , geomatchArr[7]); 
            }
            
        }

    }
}

export async function searchClick(event ,  apiUrl, map , locationMarker , locationIcon){ 

    //TODO:error handling here
    const lat = event.target.getAttribute('lat');

    const lon = event.target.getAttribute('lon');

    const latln = L.latLng(lat , lon);

    map.setView(latln , 10); 

    const dbId = event.target.getAttribute('db-id'); 

    removeLocationMarker(map , locationMarker.obj);

    addLocationMarker(map , locationIcon , locationMarker , latln);


    fireForecastResultPopup(event ,dbId , apiUrl);
}

//TODO: function that loads-reloads forecast information inside the search result popup div
export async function fireForecastResultPopup(event, dbId, apiUrl){ //expects dict with info, lat and lon are for popping up nearby fires or suspected fires

    const forecast = await getFireForecast(dbId, apiUrl);

    document.getElementById('result-info-popup').style.visibility = 'visible'; 
    document.getElementById('result-info-popup').style.height = '10em';

    var forecastTb = document.getElementById('forecast-tbody');

    if(forecastTb.hasChildNodes()){
        while(forecastTb.firstChild){forecastTb.removeChild(forecastTb.firstChild);}
    }

    createForecastPane(forecastTb , forecast , apiUrl);
}

function createForecastPane(parent , forecast){ //appends forecast header as children of parent , content is dict

    var topRow = document.createElement('tr');
    var imgRow = document.createElement('tr');
    var descRow = document.createElement('tr');

    parent.appendChild(topRow);
    parent.appendChild(imgRow);
    parent.appendChild(descRow);
    
    for(let key in forecast['weeklyForecast']){

        createForecastHeader(topRow , forecast['weeklyForecast'][key]['weekDay'] + '  ' + forecast['weeklyForecast'][key]["dayOfMonth"]);

        createForecastIcon( imgRow ,forecast['weeklyForecast'][key]['forecast']);
    }

}

//forecast takes the form of a str that is either M , D or VD
function createForecastIcon(parent , forecast){ //adds forecast icon to table base don what forecast is (calls to db) 

        var td = document.createElement('td');

        td.className = 'fire-forecast-img-td';

        parent.appendChild(td);

        var img = document.createElement('img');

        img.className = 'fire-forecast-img';

        if(forecast == 'M'){img.src = mIcon;}
        else if(forecast == 'W'){img.src = mIcon;}
        else if(forecast == 'D'){img.src = DIcon}
        else if(forecast == 'VD'){img.src = VDIcon}
        else{console.log('fix me')} //need to fix

        td.appendChild(img);

}

function createForecastHeader(parent , text){

    var dayHeader = document.createElement('td');

    dayHeader.className = 'forecast-pane-header';

    parent.appendChild(dayHeader);
    dayHeader.innerText = text;
}