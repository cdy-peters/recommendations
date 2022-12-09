export interface User {
  country: string;
  display_name: string;
  email: string;
  external_urls: any;
  followers: any;
  href: string;
  id: string;
  images: any[];
  product: string;
  type: string;
  uri: string;
}

export class AverageSongFeatures {
  acousticness: number = 0;
  danceability: number = 0;
  energy: number = 0;
  instrumentalness: number = 0;
  liveness: number = 0;
  loudness: number = 0;
  speechiness: number = 0;
  tempo: number = 0;
  valence: number = 0;
}

export interface Recommendation {
  id: string;
  name: string;
  artists: string[];
  explicit: boolean;
  preview_url: string;
  similarity: number;
}
