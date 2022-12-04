
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

