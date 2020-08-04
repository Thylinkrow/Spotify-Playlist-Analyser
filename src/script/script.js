var playlist;
var data_display;
var trackList = [];
var spotify_form;

var clientIdForm;
var clientSecretFrom;
var playlistIdForm;

/***********************************************************************
* Initialization
***********************************************************************/
function init() {
    
    data_display = document.getElementById('data_display');
	document.getElementById("requestInfo").addEventListener("click", requestInfo);
	document.getElementById("dlExcel").addEventListener("click", dlExcel);
	document.getElementById("dlJson").addEventListener("click", dlJson);
	document.getElementById("spotify_form_send").addEventListener("click",spotify_form_send);
	spotify_form = document.getElementById('spotify_form');
    
}

/***********************************************************************
* Import data from a JSON file
***********************************************************************/
function importInfo() {
	
    var file = fileInput.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        playlist = JSON.parse(reader.result);
		console.log(playlist);
		formatData();
    }
    reader.readAsText(file);
}

/***********************************************************************
* Requestion data using the Spotify API
***********************************************************************/
async function requestInfo() {
	
	if(APIController.isCredentialsSet()){
		
		const token = await APIController.getToken();
		console.log(token);
		
		playlist = await APIController.getPlaylist(playlistIdForm,token);
		console.log(playlist);
		
		formatData();
	} else {
		spotify_form.setAttribute("style","display:block;");
	}
}

/***********************************************************************
* Apply the values entered in the form
***********************************************************************/
function spotify_form_send() {
	clientIdForm = document.getElementById("clientId").value;
	clientSecretFrom = document.getElementById("clientSecret").value;
	playlistIdForm = document.getElementById("playlistId").value;
	
	APIController.setCredentials(clientIdForm,clientSecretFrom);
	spotify_form.setAttribute("style","display:none;");
	requestInfo();
}

/***********************************************************************
* Format data from a playlist (either with imported data or requested
* via the Spotify API) 
***********************************************************************/
function formatData() {
	
	var total_time_ms = 0;
	for(i=0;i<playlist.tracks.length;i++){
		total_time_ms += playlist.tracks[i].track.duration_ms;
	}
	
	var total_time_d = Math.floor(total_time_ms/86400000);
	var total_time_h = Math.floor((total_time_ms-86400000*total_time_d)/3600000);
	var total_time_m = Math.floor((total_time_ms-86400000*total_time_d-3600000*total_time_h)/60000);
	var total_time_s = Math.floor((total_time_ms-86400000*total_time_d-3600000*total_time_h-60000*total_time_m)/1000);
	
	total_time = total_time_d+" days, "+total_time_h+" hours, "+total_time_m+" minutes and "+total_time_s+" seconds";

	data_display.innerHTML = "";
	
	var title2 = document.createElement("h2");
	title2.innerHTML = playlist.name+", by "+playlist.owner.display_name+" ("+playlist.followers.total+" followers)";
	var playlist_img = document.createElement("img");
	playlist_img.setAttribute("src",playlist.images[0].url);
	var title3 = document.createElement("h3");
	title3.innerHTML = playlist.description;
	var playlist_length = document.createElement("p");
	playlist_length.innerHTML = playlist.tracks.length+" songs: "+total_time;
	
	data_display.appendChild(title2);
	data_display.appendChild(playlist_img);
	data_display.appendChild(title3);
	data_display.appendChild(playlist_length);

	playlist.tracks.forEach(formatTrackData)
	console.log(trackList);
	
	trackList.forEach(displayTrack);
}

/***********************************************************************
* Download an excel file of the playlist
***********************************************************************/
function dlExcel() {

	if(playlist != undefined){
		var trackListStr = JSON.stringify(trackList);
		
		var trackListXML = new myExcelXML(trackListStr);
		trackListXML.downLoad();
	} else {
		console.log("There is no playlist to download");
	}
	
}

/***********************************************************************
* Download a json file of the playlist 
***********************************************************************/
function dlJson() {

	if(playlist != undefined){
		downloadObjectAsJson(playlist,playlist.name);
	} else {
		console.log("There is no playlist to download");
	}
	
}

/***********************************************************************
* Format a track from the API structure 
***********************************************************************/
function formatTrackData(track) {
	
	// Format title
	var title = track.track.name;
	var splitedTitle = title.split('-');
	if(splitedTitle[2] != undefined){
		// If the title as more than one dash most likely only the first one is relevant
		title = splitedTitle[0]+"-"+splitedTitle[1];	
	} else if(splitedTitle[1] != undefined){
		// If the title as a dash chances are that whatever is after is irrelevant
		// Check for keywords
		var keywords = ["remaster","mix","from","version","edit","live","mono","instrumental","recorded"];
		var contains_keyword = false;
		var i = 0;
		while(i<keywords.length && !contains_keyword){
			contains_keyword = splitedTitle[1].toLowerCase().includes(keywords[i]);
			i++;
		}
		if(contains_keyword){
			title = splitedTitle[0];
		}
	}
	title = title.trim();
	
	// Format dates
	var added_at_split = track.added_at.split("-");
	var year = added_at_split[0];
	var month = added_at_split[1];
	var day = added_at_split[2].substring(0, 2);
	var added_at = year+"-"+month+"-"+day;
	var release_year = track.track.album.release_date.split("-")[0];
	
	// Format primary artist and featurings
	var artists = [];
	track.track.artists.forEach(function (artist){
		artists.push(artist.name);
	});
	var artist_p = artists[0];
	var artists_s = "";
	for (i = 1; i < artists.length; i++) {
		if(i>1){
			artists_s += ", ";
		}
		artists_s += artists[i];
	}
	
	// Format song length
	var duration_s = Math.floor(track.track.duration_ms / 1000);
	var minutes = Math.floor(duration_s / 60);
	var seconds = duration_s - 60 * minutes;
	
	var song = {
		"title":title,
		"artist":artist_p,
		"minutes":minutes,
		"seconds":seconds,
		"date_added":added_at,
		"who_added":track.added_by.id,
		"feat":artists_s,
		"duration_in_seconds":duration_s,
		"album_name":track.track.album.name,
		"release_year":release_year,
		"album_cover":track.track.album.images[track.track.album.images.length-1].url,
	}
	
	trackList.push(song);
}

/***********************************************************************
* Format the display of tracks in the browser's window
*
* param: track, track to display
* param: index, track's index
***********************************************************************/
function displayTrack(track, index) {
	
	var p1 = document.createElement("p");
	p1.innerHTML = track.title+" ("+track.minutes+":"+track.seconds+"), by "+track.artist;
	var p2 = document.createElement("p");
	p2.innerHTML = track.album_name+", "+track.release_year;
	var img = document.createElement("img");
	img.setAttribute("class","images");
	img.setAttribute("src",track.album_cover);
	
	var sub_content1 = document.createElement("div");
	sub_content1.setAttribute("class","sub-content");
	sub_content1.appendChild(p1);
	var sub_content2 = document.createElement("div");
	sub_content2.setAttribute("class","sub-content-img");
	sub_content2.appendChild(img);
	var sub_content3 = document.createElement("div");
	sub_content3.setAttribute("class","sub-content");
	sub_content3.appendChild(p2);
	
	var content = document.createElement("div");
	content.setAttribute("class","content");
	content.appendChild(sub_content1);
	content.appendChild(sub_content2);
	content.appendChild(sub_content3);

	data_display.appendChild(content);
  
}

function downloadObjectAsJson(exportObj, exportName) {
	
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
	var downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode);
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}