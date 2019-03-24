// Libraries
import _ from 'lodash';

// Utils
import { toUrlParams } from 'app/core/utils/url';
import coreModule from '../../core/core_module';
import appEvents from 'app/core/app_events';
import locationUtil from 'app/core/utils/location_util';
import kbn from 'app/core/utils/kbn';
import { store } from 'app/store/store';

export class PlaylistSrv {
  private cancelPromise: any;
  private dashboards: Array<{ url: string }>;
  private index: number;
  private interval: number;
  private startUrl: string;
  private numberOfLoops = 0;
  private storeUnsub: () => void;
  private validPlaylistUrl: string;
  isPlaying: boolean;

  /** @ngInject */
  constructor(private $location: any, private $timeout: any, private backendSrv: any) {}

  next() {
    this.$timeout.cancel(this.cancelPromise);

    const playedAllDashboards = this.index > this.dashboards.length - 1;
    if (playedAllDashboards) {
      this.numberOfLoops++;

      // This does full reload of the playlist to keep memory in check due to existing leaks but at the same time
      // we do not want page to flicker after each full loop.
      if (this.numberOfLoops >= 3) {
        window.location.href = this.startUrl;
        return;
      }
      this.index = 0;
    }

    const dash = this.dashboards[this.index];
    const queryParams = this.$location.search();
    const filteredParams = _.pickBy(queryParams, key => {
      return key === 'kiosk' || key === 'autofitpanels' || key === 'orgId';
    });
    const nextDashboardUrl = locationUtil.stripBaseFromUrl(dash.url);

    // this is done inside timeout to make sure digest happens after
    // as this can be called from react
    this.$timeout(() => {
      this.$location.url(nextDashboardUrl + '?' + toUrlParams(filteredParams));
    });

    this.index++;
    this.validPlaylistUrl = nextDashboardUrl;
    this.cancelPromise = this.$timeout(() => this.next(), this.interval);
  }

  prev() {
    this.index = Math.max(this.index - 2, 0);
    this.next();
  }

  // Detect url changes not caused by playlist srv and stop playlist
  storeUpdated() {
    const state = store.getState();

    if (state.location.path !== this.validPlaylistUrl) {
      this.stop();
    }
  }

  start(playlistId) {
    this.stop();

    this.startUrl = window.location.href;
    this.index = 0;
    this.isPlaying = true;

    // setup location tracking
    this.storeUnsub = store.subscribe(() => this.storeUpdated());
    this.validPlaylistUrl = this.$location.path();

    appEvents.emit('playlist-started');

    return this.backendSrv.get(`/api/playlists/${playlistId}`).then(playlist => {
      return this.backendSrv.get(`/api/playlists/${playlistId}/dashboards`).then(dashboards => {
        this.dashboards = dashboards;
        this.interval = kbn.interval_to_ms(playlist.interval);
        this.next();
      });
    });
  }

  stop() {
    if (this.isPlaying) {
      const queryParams = this.$location.search();
      if (queryParams.kiosk) {
        appEvents.emit('toggle-kiosk-mode', { exit: true });
      }
    }

    this.index = 0;
    this.isPlaying = false;

    if (this.storeUnsub) {
      this.storeUnsub();
    }

    if (this.cancelPromise) {
      this.$timeout.cancel(this.cancelPromise);
    }

    appEvents.emit('playlist-stopped');
  }
}

coreModule.service('playlistSrv', PlaylistSrv);
