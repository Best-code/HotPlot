import axios from "axios"
import mIcon from "../icons/M.png"
import DIcon from "../icons/D.png"
import VDIcon from "../icons/VD.png"
import fireEmoji from "../icons/fireEmoji.png"
import { addLocationMarker, getLocationIcon, removeLocationMarker } from "./map_utils";

export function onLoad() { //simply to render tailwind componeents visible after the rendering completes , stop event propogationfullout on elements, etc..
    document.getElementById('search-bar').style.visibility = 'visible';
    document.getElementById('result-info-popup').style.visibility = 'visible';

    (function () { //prevents sending a shitton of requests on every keystroke with a new event credit: Kelderic on stackoverflow
        var keystoppedTimer = null;

        var keystoppedInputs = document.getElementsByTagName('input');

        for (var i = 0, l = keystoppedInputs.length; i < l; i++) {

            keystoppedInputs[i].addEventListener('keydown', function (event) {

                clearTimeout(keystoppedTimer);

                keystoppedTimer = setTimeout(function () {

                    event.target.dispatchEvent(new Event('keystopped'));
                }, 300);
            }, false);
        }
    }());

    //if we have search results visible we remove them from view when map dragged/ focus out/etc
    document.getElementById('hotplot-logo0').addEventListener('click', () => { window.location.reload(); });
    document.getElementById('body').addEventListener("click", () => { document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while (results.length > 0) { results[0].remove(); } });
    document.getElementById('search-input').addEventListener('blur', () => { document.getElementById('search-input').value = ''; var results = document.getElementsByClassName('search-result'); while (results.length > 0) { results[0].remove(); } }, {});
    document.getElementById('feature-popup-close').addEventListener('click', () => { var popupSection = document.getElementById('feature-click-popup'); popupSection.style.opacity = 0; popupSection.style.visibility = 'hidden'; });
}
//location passed as [lat , lon] 
export async function geoSearch(userEntry, apiUrl, location = [32.0, -84.0]) { // takes a string and tries to match it to a place name in db

    const searchResult = await axios.get(apiUrl + '/geocode-place',
        { params: { "userInput": userEntry, "lat": location[0], "lon": location[1] } });

    return searchResult.data;
}

export async function getFireForecast(databaseId, apiUrl) {

    const forecast = await axios.get(apiUrl + '/get-fire-forecast', { params: { "id": databaseId } });


    return forecast.data;
}

export class geoWrap {
    constructor(obj) { obj = this.obj; }
}

function parseGeoMatch(tuple) { //expects a tuple formatted in the style that the postgres 'GeoMatch' function returns - or the /geosearch route returns - gives arr

    const strippedTuple = tuple.replace(/[()]+/g, '');

    var tupArr = strippedTuple.split(',');

    for (var i = 0; i < tupArr.length; i++) {
        tupArr[i] = tupArr[i].replace(/["]+/g, '');
        tupArr[i] = tupArr[i].trim();
    }

    return tupArr;
}

export function getUserCoords(mutate) { // mutates carrier class passed in to have user coords in .obj or does nothing on failure

    if (!('geolocation' in navigator)) { return; }

    navigator.geolocation.getCurrentPosition((position) => { mutate.obj = position; }, (error) => { return; }, { maximumAge: 90000 });

    return;
}

//through this function, the database id # for the record shown in any div on screen is stored as the 
//"db-id" attribute and can be retrieved on click of that element
export async function handleSearch(lat, lon, apiUrl, map, locationMarker, locationIcon) {

    const userInput = document.getElementById('search-input').value;

    if (userInput.length < 0) {
        return;
    }
    else {

        var UseDefault = false;

        var searchResults = null;

        try { lat = parseFloat(lat); lon = parseFloat(lon) } catch (error) { UseDefault = true; }

        if (UseDefault) { searchResults = await geoSearch(userInput, apiUrl); } else { searchResults = await geoSearch(userInput, apiUrl, [lat, lon]); }

        const resultBox = document.getElementById('search-result-div');

        if (searchResults.length == 0) {

            try {
                var results = document.getElementsByClassName('search-result');

                while (results.length > 0) { results[0].remove() };

                return;
            } catch (error) { return };
        }

        var newDiv = null;

        for (var i = 0; i < searchResults.length; i++) {


            if (document.getElementById('result' + (i)) == null) {

                newDiv = document.createElement('div');

                newDiv.id = 'result' + (i);

                newDiv.className = 'search-result'

                resultBox.appendChild(newDiv);

                const geomatchArr = parseGeoMatch(searchResults[i].geomatch);

                newDiv.innerText = geomatchArr[1] + ', ' + geomatchArr[2] + ',  ' + geomatchArr[3] + ' County';


                newDiv.setAttribute("db-id", geomatchArr[0]) //set to database id for object for qury of the DB on click of div
                newDiv.setAttribute('lat', geomatchArr[6]);
                newDiv.setAttribute('lon', geomatchArr[7]);

                newDiv.addEventListener('mousedown', (event) => { searchClick(event, apiUrl, map, locationMarker, locationIcon); }) //TODO:implement
            }
            else {

                var searchElement = document.getElementById('result' + i)

                const geomatchArr = parseGeoMatch(searchResults[i].geomatch);

                searchElement.innerText = geomatchArr[1] + ', ' + geomatchArr[2] + ',  ' + geomatchArr[3] + ' County';

                searchElement.setAttribute("db-id", geomatchArr[0]); //updates db id on new search result taking its place
                searchElement.setAttribute('lat', geomatchArr[6]);
                searchElement.setAttribute('lon', geomatchArr[7]);
            }

        }

    }
}

export async function searchClick(event, apiUrl, map, locationMarker, locationIcon) {

    //TODO:error handling here
    const lat = event.target.getAttribute('lat');

    const lon = event.target.getAttribute('lon');

    const latln = L.latLng(lat, lon);

    map.setView(latln, 10);

    const dbId = event.target.getAttribute('db-id');

    removeLocationMarker(map, locationMarker.obj);

    addLocationMarker(map, locationIcon, locationMarker, latln);


    fireForecastResultPopup(event, dbId, apiUrl);
}

//TODO: function that loads-reloads forecast information inside the search result popup div
export async function fireForecastResultPopup(event, dbId, apiUrl) { //expects dict with info, lat and lon are for popping up nearby fires or suspected fires

    const forecast = await getFireForecast(dbId, apiUrl);

    document.getElementById('result-info-popup').style.visibility = 'visible';
    // document.getElementById('result-info-popup').style.height = '7.5em';

    var forecastTb = document.getElementById('forecast-tbody');

    if (forecastTb.hasChildNodes()) {
        while (forecastTb.firstChild) { forecastTb.removeChild(forecastTb.firstChild); }
    }

    createForecastPane(forecastTb, forecast);
}

function createForecastPane(parent, forecast) { //appends forecast header as children of parent , content is dict

    var row = document.createElement('div');
    row.className = "w-full h-full flex flex-row text-md justify-between items-center "

    parent.appendChild(row);

    for (let key in forecast['weeklyForecast']) {

        var col = document.createElement('div');

        col.className = "flex flex-col w-full h-full gap-y-1 items-center justify-center"

        createForecastCol(col, forecast['weeklyForecast'][key]);
        row.appendChild(col);
    }

}

//forecast takes the form of a str that is either M , D or VD
function createForecastCol(parent, forecast) { //adds forecast icon to table based on what forecast is (calls to db) 

    // Container for the entire vertical columb
    var forecastCol = document.createElement('div');
    const lowRiskGradient = "lowRiskGradient"
    const medRiskGradient = "lowMedRiskGradient"
    const medHighRiskGradient = "highMedRiskGradient"
    const highRiskGradient = "highRiskGradient"

    forecastCol.className = "flex flex-col w-24 h-full items-center justify-center gap-y-2 py-1 "

    parent.appendChild(forecastCol);

    // The Day and Number on top
    var daySpan = document.createElement("span");
    daySpan.className = "lg:text-xl md:text-lg text-md text-center";
    console.log(forecast);
    daySpan.innerText = forecast['weekDay'].slice(0,3) + " " + forecast['dayOfMonth'];
    forecastCol.appendChild(daySpan);

    // The div for the icons
    var iconDiv = document.createElement('div');
    iconDiv.className = ("flex flex-row gap-x-1 w-full items-center justify-center h-full")
    forecastCol.appendChild(iconDiv);

    var count;
    var risk;
    switch (forecast['forecast']) {
        case "M":
            count = 1;
            risk = "Low Risk";
            forecastCol.className += lowRiskGradient;
            break;
        case "W":
            count = 2;
            risk = "Warning";
            forecastCol.className += medRiskGradient;
            break;
        case "D":
            count = 3;
            risk = "Dangerous";
            forecastCol.className += medHighRiskGradient;
            break;
        case "VD":
            count = 4;
            risk = "Very Dangerous";
            forecastCol.className += highRiskGradient;
            break;
        default:
            count = 0;
            risk = "N/A";
            forecastCol.className += highRiskGradient;
            console.log("Error in forecast : Fix Me");
            break;
    }


    for (var x = 0; x < count; x++) {
        var img = document.createElement('img');
        img.className = "lg:w-6 md:w-5 w-3 aspect-square transition-all duration-200 drop-shadow-2xl hover:scale-[125%]"
        img.src = fireEmoji;
        iconDiv.appendChild(img);
    }

    var riskSpan = document.createElement("span");
    riskSpan.className = "text-md font-thin lg:block hidden text-nowrap text-center";
    riskSpan.innerText = risk;
    forecastCol.appendChild(riskSpan);

}