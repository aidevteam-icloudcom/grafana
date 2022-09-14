import { t } from '@lingui/macro';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { AppEvents, NavModelItem, UrlQueryValue } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import appEvents from 'app/core/app_events';
import store from 'app/core/store';
import { isShallowEqual } from 'app/core/utils/isShallowEqual';
import { KioskMode } from 'app/types';

import { RouteDescriptor } from '../../navigation/types';

export interface AppChromeState {
  chromeless?: boolean;
  sectionNav: NavModelItem;
  pageNav?: NavModelItem;
  actions?: React.ReactNode;
  searchBarHidden?: boolean;
  megaMenuOpen?: boolean;
  kioskMode: KioskMode;
}

const defaultSection: NavModelItem = { text: 'Grafana' };

export class AppChromeService {
  searchBarStorageKey = 'SearchBar_Hidden';
  private currentRoute?: RouteDescriptor;
  private routeChangeHandled?: boolean;

  readonly state = new BehaviorSubject<AppChromeState>({
    chromeless: true, // start out hidden to not flash it on pages without chrome
    sectionNav: defaultSection,
    searchBarHidden: store.getBool(this.searchBarStorageKey, false),
    kioskMode: KioskMode.Off,
  });

  setMatchedRoute(route: RouteDescriptor) {
    if (this.currentRoute !== route) {
      this.currentRoute = route;
      this.routeChangeHandled = false;
    }
  }

  update(update: Partial<AppChromeState>) {
    const current = this.state.getValue();
    const newState: AppChromeState = {
      ...current,
    };

    // when route change update props from route and clear fields
    if (!this.routeChangeHandled) {
      newState.actions = undefined;
      newState.pageNav = undefined;
      newState.sectionNav = defaultSection;
      newState.chromeless = this.currentRoute?.chromeless;
      this.routeChangeHandled = true;
    }

    Object.assign(newState, update);

    if (!isShallowEqual(current, newState)) {
      this.state.next(newState);
    }
  }

  useState() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useObservable(this.state, this.state.getValue());
  }

  onToggleMegaMenu = () => {
    this.update({ megaMenuOpen: !this.state.getValue().megaMenuOpen });
  };

  setMegaMenu = (megaMenuOpen: boolean) => {
    this.update({ megaMenuOpen });
  };

  onToggleSearchBar = () => {
    const searchBarHidden = !this.state.getValue().searchBarHidden;
    store.set(this.searchBarStorageKey, searchBarHidden);
    this.update({ searchBarHidden });
  };

  onToggleKioskMode = () => {
    const nextMode = this.getNextKioskMode();
    this.update({ kioskMode: nextMode });
    locationService.partial({ kiosk: this.getKioskUrlValue(nextMode) });
  };

  setKioskModeFromUrl(kiosk: UrlQueryValue) {
    switch (kiosk) {
      case 'tv':
        this.update({ kioskMode: KioskMode.TV });
      case '1':
      case true:
        this.update({ kioskMode: KioskMode.Full });
    }
  }

  getKioskUrlValue(mode: KioskMode) {
    switch (mode) {
      case KioskMode.Off:
        return null;
      case KioskMode.TV:
        return 'tv';
      case KioskMode.Full:
        return true;
    }
  }

  private getNextKioskMode() {
    const { kioskMode } = this.state.getValue();

    switch (kioskMode) {
      case KioskMode.Off:
        return KioskMode.TV;
      case KioskMode.TV:
        return KioskMode.Full;
      case KioskMode.Full:
        appEvents.emit(AppEvents.alertSuccess, [
          t({ id: 'navigation.kiosk.tv-alert', message: 'Press ESC to exit Kiosk mode' }),
        ]);
        return KioskMode.Off;
    }
  }
}
