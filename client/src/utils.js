export function onLoad(){ //simply to render tailwind componeents visible after the rendering completes , stop event propogationfullout on elements, etc..
    document.getElementById('search-bar').style.visibility = 'visible';
    document.getElementById('search-bar').addEventListener('submit' , function (event){event.stopPropagation();})
}    