/***********************************************************************
* Manages the connection with the Spotify Web API
***********************************************************************/
const APIController = (function() {

	clientId = '';
    clientSecret = '';

    // private methods
	/***********************************************************************
	* Set your credential in order to get token
	***********************************************************************/
	const _setCredentials = (client_id,client_secret) => {
		
		clientId = client_id;
		clientSecret = client_secret;
	}
	
	/***********************************************************************
	* Check wether credentials are set
	***********************************************************************/
	const _isCredentialsSet = () => {
		
		return clientId.length>0 && clientSecret.length>0;
	}
	
	/***********************************************************************
	* Request a token to the Spotify API
	*
	* return: the newly generated token by the API
	***********************************************************************/
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }
	
	/***********************************************************************
	* Request a playlist data
	*
	* param: playlist_id, ID of the playlist to get data from
	* param: token, Spotify token
	*
	* return: the list of traks contained in the playlist (in json format)
	***********************************************************************/
	const _getPlaylist = async (playlist_id,token) => {
		
		playlist = [];

		result = await fetch('https://api.spotify.com/v1/playlists/'+playlist_id, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });
		
		holder = await result.json();
		data = holder.tracks;
		playlist = playlist.concat(data.items);
		
		while (data.next != null){
			result = await fetch(data.next, {
				method: 'GET',
				headers: { 'Authorization' : 'Bearer ' + token}
			});
			
			data = await result.json();
			playlist = playlist.concat(data.items);
		}
		
		holder.tracks = playlist;
        return holder;
    }

    return {
		setCredentials(client_id,client_secret) {
			return _setCredentials(client_id,client_secret);
		},
		isCredentialsSet() {
            return _isCredentialsSet();
        },
        getToken() {
            return _getToken();
        },
		getPlaylist(playlist_id,token) {
			return _getPlaylist(playlist_id,token);
		},
    }
})();