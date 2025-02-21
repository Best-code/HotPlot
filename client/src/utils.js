import axios from "axios"

export function onLoad(){ //simply to render tailwind componeents visible after the rendering completes , stop event propogationfullout on elements, etc..
    document.getElementById('search-bar').style.visibility = 'visible';

}    
//location passed as [lat , lon] 
export async function geoSearch(userEntry , apiUrl , location){ // takes a string and tries to match it to a place name in db

    const searchResult = await axios.get(apiUrl + '/geocode-place' , 
            {params : {"userInput" : userEntry , "lat" : location[0] , "lon" : location[1]}} );

    return searchResult.data.result.rows;
}

export class geoWrap{
    constructor(obj){obj = this.obj;}
}

export function getUserCoords(mutate){ // returns false on failure

    if( ! ('geolocation' in navigator)){return;}

    navigator.geolocation.getCurrentPosition((position)=>{mutate.obj = position;} , (error)=>{return;})
     
    return;
}