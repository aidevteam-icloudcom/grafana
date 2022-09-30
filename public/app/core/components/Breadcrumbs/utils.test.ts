import { NavModelItem } from '@grafana/data';

import { buildBreadcrumbs } from './utils';

const mockHomeNav: NavModelItem = {
  text: 'Home',
  url: '/home',
  id: 'home',
};

describe('breadcrumb utils', () => {
  describe('buildBreadcrumbs', () => {
    it('includes breadcrumbs for the section nav', () => {
      const sectionNav: NavModelItem = {
        text: 'My section',
        url: '/my-section',
      };
      expect(buildBreadcrumbs(mockHomeNav, sectionNav)).toEqual([{ text: 'My section', href: '/my-section' }]);
    });

    it('includes breadcrumbs for the page nav', () => {
      const sectionNav: NavModelItem = {
        text: 'My section',
        url: '/my-section',
      };

      const pageNav: NavModelItem = {
        text: 'My page',
        url: '/my-page',
      };
      expect(buildBreadcrumbs(mockHomeNav, sectionNav, pageNav)).toEqual([
        { text: 'My section', href: '/my-section' },
        { text: 'My page', href: '/my-page' },
      ]);
    });

    it('includes breadcrumbs for any parents in the section nav', () => {
      const sectionNav: NavModelItem = {
        text: 'My section',
        url: '/my-section',
        parentItem: {
          text: 'My parent section',
          url: '/my-parent-section',
        },
      };
      expect(buildBreadcrumbs(mockHomeNav, sectionNav)).toEqual([
        { text: 'My parent section', href: '/my-parent-section' },
        { text: 'My section', href: '/my-section' },
      ]);
    });

    it('includes breadcrumbs for any parents in the section nav or page nav', () => {
      const pageNav: NavModelItem = {
        text: 'My page',
        url: '/my-page',
        parentItem: {
          text: 'My parent page',
          url: '/my-parent-page',
        },
      };
      const sectionNav: NavModelItem = {
        text: 'My section',
        url: '/my-section',
        parentItem: {
          text: 'My parent section',
          url: '/my-parent-section',
        },
      };
      expect(buildBreadcrumbs(mockHomeNav, sectionNav, pageNav)).toEqual([
        { text: 'My parent section', href: '/my-parent-section' },
        { text: 'My section', href: '/my-section' },
        { text: 'My parent page', href: '/my-parent-page' },
        { text: 'My page', href: '/my-page' },
      ]);
    });

    it('shortcircuits if the home nav is found early', () => {
      const pageNav: NavModelItem = {
        text: 'My page',
        url: '/my-page',
        parentItem: {
          text: 'My parent page',
          url: '/home',
        },
      };
      const sectionNav: NavModelItem = {
        text: 'My section',
        url: '/my-section',
        parentItem: {
          text: 'My parent section',
          url: '/my-parent-section',
        },
      };
      expect(buildBreadcrumbs(mockHomeNav, sectionNav, pageNav)).toEqual([
        { text: 'Home', href: '/home' },
        { text: 'My page', href: '/my-page' },
      ]);
    });
  });
});
