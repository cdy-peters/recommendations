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
}