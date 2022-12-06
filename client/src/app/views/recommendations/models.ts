export interface AverageSongFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  tempo: number;
  valence: number;
}

export interface Artist {
  external_urls: any;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}
export interface Track {
  album: any;
  artists: Artist[];
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
export interface Recommendations {
  seeds: any[];
  tracks: Track[];
}

export interface Recommendation {
  id: string;
  name: string;
  artists: string[];
  explicit: boolean;
  preview_url: string;
  similarity: number;
}

export interface Features {
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

export interface CreatePlaylist {
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
  public: true;
  snapshot_id: string;
  tracks: any;
  type: string;
  uri: string;
}
