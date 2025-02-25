import axios from "axios"

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

    //if we have search results visible we remove them from view when map dragged
    document.getElementById('body').addEventListener("click" , ()=>{document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while(results.length > 0){results[0].remove();}});
    document.getElementById('result-popup-close').addEventListener('click' , ()=>{var infoBox = document.getElementById('result-info-popup'); infoBox.style.transition = 'height .4s'; infoBox.style.height = 0; infoBox.style.visibility = 'hidden';});

}    
//location passed as [lat , lon] 
export async function geoSearch(userEntry , apiUrl , location = [32.0 , -84.0]){ // takes a string and tries to match it to a place name in db

    const searchResult = await axios.get(apiUrl + '/geocode-place' , 
            {params : {"userInput" : userEntry , "lat" : location[0] , "lon" : location[1]}} );

    return searchResult.data.result.rows;
}

export async function getFireForecast( databaseId,  apiUrl){
    
    const forecast = await axios.get(apiUrl + '/get-fire-forecast'  , {params : { "id" : databaseId}});

    return forecast.data.result.rows;
}

export class geoWrap{
    constructor(obj){obj = this.obj;}
}

function parseGeoMatch(tuple){ //expects a tuple formatted in the style that the postgres 'GeoMatch' function returns - or the /geosearch route returns - gives json
    
    const strippedTuple = tuple.replace(/[()]+/g , '');

    var tupArr = strippedTuple.split(',');

    for(var i =0;i<tupArr.length;i++){
        tupArr[i] = tupArr[i].replace(/["]+/g , '');
        tupArr[i] = tupArr[i].trim();
    }

    return tupArr;
}

export function getUserCoords(mutate , map){ // mutates carrier class passed in to have user coords in .obj or does nothing on failure

    if( ! ('geolocation' in navigator)){return;}

    navigator.geolocation.getCurrentPosition((position)=>{mutate.obj = position;} , (error)=>{return;})

    return;
}

//through this function, the database id # for the record shown in any div on screen is stored as the 
//"db-id" attribute and can be retrieved on click of that element
export async function handleSearch(lat , lon , apiUrl , map){

    const userInput = document.getElementById('search-input').value;

    if(userInput.length < 3){
        return;
    }
    else{
        
        var UseDefault = false;

        var searchResults = null;

        try{lat = parseFloat(lat); lon = parseFloat(lon)}catch(error){UseDefault=true;}

        if(UseDefault){searchResults = await geoSearch(userInput, apiUrl );}else{searchResults = await geoSearch(userInput , apiUrl , [lat , lon]);}

        const resultBox = document.getElementById('search-result-div');

        var newDiv = null;

        for(var i = 0; i < 4; i++){
            

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

                newDiv.addEventListener('click' , (event)=>{searchClick(event , apiUrl , map);}) //TODO:implement
            }
            else{

                var searchElement = document.getElementById('result' + i)

                const geomatchArr = parseGeoMatch(searchResults[i].geomatch);

                console.log(geomatchArr);

                searchElement.innerText = geomatchArr[1] + ', ' + geomatchArr[2] + ',  ' + geomatchArr[3] + ' County';

                searchElement.setAttribute("db-id" , geomatchArr[0]); //updates db id on new search result taking its place
                searchElement.setAttribute('lat' , geomatchArr[6]);
                searchElement.setAttribute('lon' , geomatchArr[7]); 
            }
            
        }

    }
}

export async function searchClick(event ,  apiUrl, map){ 

    //TODO:error handling here
    const lat = event.target.getAttribute('lat');

    const lon = event.target.getAttribute('lon');

    const latln = L.latLng(lat , lon);

    map.flyTo(latln); 

    //var pulsingIcon = L.icon.pulse({iconSize:[12,12]});

    //var marker = L.marker(latln,{icon: pulsingIcon}).addTo(map); //TODO:fix /implement marker add/remove

    const forecast = await getFireForecast(event.target.getAttribute('db-id') , apiUrl);

    document.getElementById('result-info-popup').style.visibility = 'visible'; 
    document.getElementById('result-info-popup').style.height = '15em';
    

    console.log(forecast);
    //TODO: implement popup functionality that shows forecast

    
}

//TODO: function that loads-reloads forecast information inside the search result popup div
export function resultPopup(content){



}