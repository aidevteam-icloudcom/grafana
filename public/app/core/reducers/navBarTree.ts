import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NavModelItem } from '@grafana/data';
import config from 'app/core/config';

export const initialState: NavModelItem[] = config.bootData?.navTree ?? [];

const navTreeSlice = createSlice({
  name: 'navBarTree',
  initialState,
  reducers: {
    setStarred: (state, action: PayloadAction<{ id: string; title: string; url: string; isStarred: boolean }>) => {
      const starredItems = state.find((navItem) => navItem.id === 'starred');
      const { id, title, url, isStarred } = action.payload;
      if (isStarred) {
        const newStarredItem: NavModelItem = {
          id,
          text: title,
          url,
        };
        starredItems?.children?.push(newStarredItem);
        starredItems?.children?.sort((a, b) => a.text.localeCompare(b.text));
      } else {
        const index = starredItems?.children?.findIndex((item) => item.id === id) ?? -1;
        if (index > -1) {
          starredItems?.children?.splice(index, 1);
        }
      }
    },
  },
});

export const { setStarred } = navTreeSlice.actions;
export const navTreeReducer = navTreeSlice.reducer;
