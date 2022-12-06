
export interface Artists {
    external_urls: any;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface Track {
    album: any;
    artists: Artists[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    episode: boolean;
    explicit: boolean;
    external_ids: any;
    external_urls: any;
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: string;
    track: boolean;
    track_number: number;
    type: string;
    uri: string;
}

export interface PlaylistItems {
    href: string;
    items: {
        added_at: string;
        added_by: any;
        is_local: boolean;
        primary_color: any;
        track: Track;
        video_thumbnail: any;
    }[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
}

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

export interface Artist {
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