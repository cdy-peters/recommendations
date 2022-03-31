# Portfolio Project - Spotify App (EARLY IN DEVELOPMENT, CURRENTLY NON-FUNCTIONAL)

## Description

This Spotify app determines songs similar to that of a selected playlist by the user. The app authenticates a user who can proceed to select a Spotify playlist of theirs, including their saved songs. All of the songs within the selected playlist will be analysed, retrieving information about each song. The information collected are values measuring numerous characteristics that correlate to the songs style and type. These values are collated and averaged before finding songs with comparable values.

## Requirements

### Setup

##### Setting up Spotify Development Dashboard
1. Visit the [Spotify Development Dashboard](https://developer.spotify.com/dashboard/login) and login/register
2. Create an app with a name and description of your choosing, agreeing to the Terms and Conditions
3. Go to Edit Settings and add the Redirect URI *http://example.com* and save


### Installation

##### Required packages can be installed via:

```bash
pip install -r requirements.txt
```

##### Required environment variables:

- [Spotify Development Dashboard](https://developer.spotify.com/dashboard/login)
    - SPOTIPY_CLIENT_ID - This is in the Spotify Development Dashboard
    - SPOTIPY_CLIENT_SECRET - This is in the Spotify Development Dashboard
    - SPOTIPY_REDIRECT_URI - Set this as the Redirect URI set in the Spotify Development Dashboard

## Usage

## Roadmap

## Authors and Acknowledgement
Developed by Cody Peters

## License
[MIT License](https://choosealicense.com/licenses/mit/)