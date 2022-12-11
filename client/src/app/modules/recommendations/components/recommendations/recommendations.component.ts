import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import { QueryService } from 'src/app/shared/services/query.service';
import { TransferDataService } from 'src/app/shared/services/transfer-data.service';
import { RecommendationsService } from '../../services/recommendations.service';

import {
  AverageSongFeatures,
  Recommendation,
} from 'src/app/shared/models/models';
import { CreatePlaylistResponse } from 'src/app/shared/models/spotify-models';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
})
export class RecommendationsComponent {
  constructor(
    private query: QueryService,
    private transfer: TransferDataService,
    private recommend: RecommendationsService
  ) {}

  showAverageFeatures: boolean = true;
  showAverageFeaturesChanged: boolean = false;
  showAverageFeaturesDropdown: boolean = false;

  selectedPlaylist: any;
  songsRetrieved: number = 0;
  artistsRetrieved: number = 0;
  genresRetrieved: number = 0;

  recommendations: Recommendation[] = [];
  averageFeatures: AverageSongFeatures = new AverageSongFeatures();
  @ViewChild('getMoreRecommendations') getMoreRecommendations!: ElementRef;

  playingTrack: string = '';
  @ViewChild('songPreview')
  songPreview!: ElementRef;

  selectedTracks: string[] = [];
  @ViewChildren('checkboxes') checkboxes!: QueryList<ElementRef>;
  selectAll: boolean = false;
  addedTracks: string[] = [];
  @ViewChild('thisPlaylist') thisPlaylist!: ElementRef;
  @ViewChild('newPlaylist') newPlaylist!: ElementRef;

  async ngOnInit() {
    if (window.innerWidth < 1000) {
      this.showAverageFeatures = false;
      this.showAverageFeaturesDropdown = true;
    }

    const data = this.transfer.getData();

    this.selectedPlaylist = data.selectedPlaylist;
    this.songsRetrieved = data.tracks.length;
    this.artistsRetrieved = data.artists.length;
    this.genresRetrieved = data.genres.length;

    // Receive data from promise
    var { recommendations, averageFeatures } =
      await this.recommend.getRecommendations(data);
    this.recommendations.push(...recommendations);
    this.averageFeatures = averageFeatures;

    // Set marquee
    setTimeout(() => {
      setTrackMarquee();
    }, 0);
  }

  async moreRecommendations() {
    this.getMoreRecommendations.nativeElement.disabled = true;
    this.getMoreRecommendations.nativeElement.innerHTML =
      'Getting Recommendations...';

    var recommendations = await this.recommend.getMoreRecommendations();

    recommendations.forEach((r) => {
      if (!this.recommendations.some((t) => t.id === r.id)) {
        this.recommendations.push(r);
      }
    });

    setTimeout(() => {
      setTrackMarquee();
    }, 0);

    this.getMoreRecommendations.nativeElement.disabled = false;
    this.getMoreRecommendations.nativeElement.innerHTML =
      'Get More Recommendations';
  }

  onShowAverageFeatures() {
    this.showAverageFeatures = !this.showAverageFeatures;
    this.showAverageFeaturesChanged = true;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    setTrackMarquee();

    if (window.innerWidth < 1000) {
      if (this.showAverageFeaturesChanged) return;
      this.showAverageFeatures = false;
      this.showAverageFeaturesDropdown = true;
    } else {
      this.showAverageFeatures = true;
      this.showAverageFeaturesChanged = false;
      this.showAverageFeaturesDropdown = false;
    }
  }

  onCheckboxChange(e: any, id: string) {
    if (e.target.checked) {
      this.selectedTracks.push(id);
    } else {
      this.selectedTracks = this.selectedTracks.filter((t) => t !== id);
    }
    console.log(this.selectedTracks);
  }

  onSelectAll() {
    this.selectAll = !this.selectAll;
    this.checkboxes.forEach((checkbox) => {
      checkbox.nativeElement.checked = this.selectAll;
    });

    if (this.selectAll) {
      this.selectedTracks = this.recommendations.map((t) => t.id);
    } else {
      this.selectedTracks = [];
    }
  }

  async addThisPlaylist(newPlaylistId?: string) {
    var id = this.selectedPlaylist.id;
    var uris = [];

    if (newPlaylistId) {
      id = newPlaylistId;
      uris = this.selectedTracks.map((t) => `spotify:track:${t}`);
    } else {
      this.thisPlaylist.nativeElement.disabled = true;
      this.thisPlaylist.nativeElement.innerHTML = 'Adding...';

      for (const track of this.selectedTracks) {
        if (!this.addedTracks.includes(track)) {
          uris.push(`spotify:track:${track}`);
          this.addedTracks.push(track);
        }
      }

      if (uris.length === 0) {
        this.thisPlaylist.nativeElement.disabled = false;
        this.thisPlaylist.nativeElement.innerHTML = 'This playlist';
        return;
      }
    }

    var url = `https://api.spotify.com/v1/playlists/${id}/tracks`;
    var response = await this.query.post(url, { uris });

    if (this.thisPlaylist.nativeElement.disabled) {
      this.thisPlaylist.nativeElement.disabled = false;
      this.thisPlaylist.nativeElement.innerHTML = 'This playlist';
    } else {
      this.newPlaylist.nativeElement.disabled = false;
      this.newPlaylist.nativeElement.innerHTML = 'New playlist';
    }

    console.log(response);
  }

  async addNewPlaylist() {
    this.newPlaylist.nativeElement.disabled = true;
    this.newPlaylist.nativeElement.innerHTML = 'Adding...';

    var userId = localStorage.getItem('userId');
    var url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    var body = {
      name: `Recommendations for ${this.selectedPlaylist.name}`,
      description:
        'Recommendations retrieved from Recommendations for Spotify. Accessible at https://codypeters.dev/recommendations.',
    };
    var response = <CreatePlaylistResponse>await this.query.post(url, body);

    if (!response.error) this.addThisPlaylist(response.id);
  }

  previewHandler(url: string) {
    if (this.songPreview.nativeElement.src === url) url = '';

    this.songPreview.nativeElement.src = url;
    this.playingTrack = url;

    if (url) this.songPreview.nativeElement.play();
  }
}
