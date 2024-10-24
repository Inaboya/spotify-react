import { useState, useEffect } from 'react';
import { SpotifyApiContext } from 'react-spotify-api';
import Cookies from 'js-cookie';
import { SpotifyAuth, Scopes } from 'react-spotify-auth';
import 'react-spotify-auth/dist/index.css';
import './App.css';

const loadSpotifySDK = () => {
  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;
  document.body.appendChild(script);
};

function App() {
  const [token, setToken] = useState(Cookies.get('spotifyAuthToken'));
  const [player, setPlayer] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [deviceId, setDeviceId] = useState(null); // Add state for deviceId

  const artistURI = 'spotify:artist:4NqH3V7GS0Igs1VyGMXEi8';

  useEffect(() => {
    loadSpotifySDK();

    // Wait for the Spotify SDK to initialize
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'React Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      // Connect to the player!
      spotifyPlayer.connect();

      // Event listeners for player state
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id); // Store device_id in state
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPaused(state.paused);
      });
    };
  }, [token]);


  const removeToken = () => {
    console.log(123)
    Cookies.remove('spotifyAuthToken'); // 'token' is the cookie name
  }

  // Function to play the artist's music
  const playArtist = async () => {
    if (!deviceId) {
      console.error('Spotify player is not ready yet.');
      return;
    }

    // Use Spotify's Web API to play the artist using the device ID
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        context_uri: artistURI,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 204) {
          console.log('Started playing artist.');
        } else {
          console.error('Error starting playback:', response);
        }
      })
      .catch((error) => {
        console.error('Error playing artist:', error);
      });
  };

  const handlePlayPause = () => {
    if (!player) return;

    player.getCurrentState().then(state => {
      if (!state) {
        console.error('User is not playing music through the Web Playback SDK');
        return;
      }

      if (state.paused) {
        player.resume().then(() => {
          console.log('Resumed playback!');
        });
      } else {
        player.pause().then(() => {
          console.log('Paused playback!');
        });
      }
    });
  };

  console.log({ token });

  return (
    <div className='app'>
      {token ? (
        <SpotifyApiContext.Provider value={token}>
          <h2>Spotify Web Player</h2>
          {/* Play Artist Button */}
          <button onClick={playArtist}>Play Artist</button>
          {/* Play/Pause Button */}
          <button onClick={handlePlayPause}>
            {isPaused ? 'Play Song' : 'Pause Song'}
          </button>
          <button onClick={removeToken}>Log out</button>
        </SpotifyApiContext.Provider>
      ) : (
        // Display the login page
        <SpotifyAuth
          redirectUri='http://localhost:5173'
          clientID='cfe6dca828d640e9ae3a74e53817be89'
          scopes={[
            Scopes.userReadPrivate,
            'user-read-email',
            'user-read-playback-state',
            'user-modify-playback-state',
            'streaming' // Add this scope
          ]}
          onAccessToken={(token) => setToken(token)}
        />
      )}
    </div>
  );
}

export default App;
