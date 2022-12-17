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
  similarity?: number;
}
