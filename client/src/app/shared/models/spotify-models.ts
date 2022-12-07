// https://developer.spotify.com/documentation/web-api/reference/#/operations/get-a-list-of-current-users-playlists
export interface PlaylistItems {
  collaborative: boolean;
  description: string;
  external_urls: any;
  href: string;
  id: string;
  images: any[];
  name: string;
  owner: any;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}
export interface PlaylistsResponse {
  items: PlaylistItems[];
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
}

// https://developer.spotify.com/documentation/web-api/reference/#/operations/get-playlists-tracks
export interface PlaylistItemsResponse {
  href: string;
  items: any[];
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
}

// https://developer.spotify.com/documentation/web-api/reference/#/operations/get-audio-features
export interface FeaturesResponse {
  acousticness: number;
  analysis_url: string;
  danceability: number;
  duration_ms: number;
  energy: number;
  id: string;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  track_href: string;
  type: string;
  uri: string;
  valence: number;
}

// https://developer.spotify.com/documentation/web-api/reference/#/operations/get-an-artist
export interface ArtistResponse {
  external_urls: any;
  followers: any;
  genres: string[];
  href: string;
  id: string;
  images: any[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}

// https://developer.spotify.com/documentation/web-api/reference/#/operations/get-recommendations
export interface RecommendationsArtist {
  external_urls: any;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}
export interface RecommendationsTrack {
  album: any;
  artists: RecommendationsArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: any;
  external_urls: any;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
}
export interface RecommendationsResponse {
  seeds: any[];
  tracks: RecommendationsTrack[];
}

// https://developer.spotify.com/documentation/web-api/reference/#/operations/create-playlist
export interface CreatePlaylistResponse {
  error?: any;
  collaborative: boolean;
  description: string;
  external_urls: any;
  followers: any;
  href: string;
  id: string;
  images: any[];
  name: string;
  owner: any;
  public: boolean;
  snapshot_id: string;
  tracks: any;
  type: string;
  uri: string;
}
