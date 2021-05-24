import React from 'react';
import { css } from '@emotion/css';
import { PluginTypeCode } from 'types';

interface PluginTypeIconProps {
  typeCode: PluginTypeCode;
  size: number;
}

export const PluginTypeIcon = ({ typeCode, size }: PluginTypeIconProps) => {
  const imageUrl = ((typeCode: string) => {
    switch (typeCode) {
      case 'panel':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNC4zMzEiIHZpZXdCb3g9Ii02MiA2My42NjkgMjUgMjQuMzMxIj48dGl0bGU+aWNvbl9kYXRhLXNvdXJjZTwvdGl0bGU+PHBhdGggZD0iTS00MS40MDUgNjMuNjczaC0xNi4xOUE0LjQxIDQuNDEgMCAwIDAtNjIgNjguMDc4djE1LjUxN0E0LjQxIDQuNDEgMCAwIDAtNTcuNTk1IDg4aDE2LjE5QTQuNDEgNC40MSAwIDAgMC0zNyA4My41OTVWNjguMDc4YTQuNDEgNC40MSAwIDAgMC00LjQwNS00LjQwNXptMy43MjcgMTkuOTIyYTMuNzMxIDMuNzMxIDAgMCAxLTMuNzI3IDMuNzI3aC0xNi4xOWEzLjczMSAzLjczMSAwIDAgMS0zLjcyNy0zLjcyN1Y2OC4wNzhhMy43MzEgMy43MzEgMCAwIDEgMy43MjctMy43MjdoMTYuMTlhMy43MzEgMy43MzEgMCAwIDEgMy43MjcgMy43Mjd2MTUuNTE3eiIgZmlsbD0iIzg5ODk4OSIvPjxnIGZpbGw9IiM4OTg5ODkiPjxwYXRoIGQ9Ik0tNTYuNDU3IDg1LjE0N2gxMy45MTRhMi4zNSAyLjM1IDAgMCAwIDIuMjctMS43NTloLTE4LjQ1NGEyLjM1MSAyLjM1MSAwIDAgMCAyLjI3IDEuNzU5em0uMDQ3LTguNzA2bDIuMDg3LjgzLjgxLS45NzdoLTUuMjk5djEuNjgzbDEuNjM2LTEuNDA4YS43NTEuNzUxIDAgMCAxIC43NjYtLjEyOHptNS44MzktMy42OTRoLTguMjQxdjIuODI4aDUuODk1em03Ljk0OSAyLjgyOGguNzM5bDEuNjk1LTEuMzA0di0xLjUyNGgtNC4yN3ptLTE2LjE5IDQuMzgxdjIuNzEzaDE4LjYyNHYtMi44MjhoLTE4LjQ5MXptOS43NjYtOS4wNDdhLjc0OC43NDggMCAwIDEgLjg5MS0uMjAybDIuODY5IDEuMzIyaDUuMDk5VjY5LjJoLTE4LjYyNXYyLjgyOGg4LjgzOGwuOTI4LTEuMTE5em02LjUwMy00LjM4N2gtMTMuOTE0YTIuMzUyIDIuMzUyIDAgMCAwLTIuMzE2IDEuOTZoMTguNTQ1YTIuMzUgMi4zNSAwIDAgMC0yLjMxNS0xLjk2em0tNC43NjggNi4yMjVoLTEuMzExbC0yLjM0NiAyLjgyOGg2LjU1OGwtMS4zODItMi4xMjh6Ii8+PHBhdGggZD0iTS00Mi4xMDUgNzcuNjM5YS43NDcuNzQ3IDAgMCAxLTEuMDg2LS4xODZsLS43NTItMS4xNThoLTcuNjIxbC0xLjk1MiAyLjM1NGEuNzUuNzUgMCAwIDEtLjg1NC4yMTlsLTIuMTcyLS44NjQtMS4zMDEgMS4xMmgxNy42NTd2LTIuODI4aC0uMTdsLTEuNzQ5IDEuMzQzeiIvPjwvZz48L3N2Zz4=';
      case 'datasource':
        return 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOS4wLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMjVweCIgaGVpZ2h0PSIyNC4zcHgiIHZpZXdCb3g9Ii0xODcgNzMuNyAyNSAyNC4zIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IC0xODcgNzMuNyAyNSAyNC4zOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSINCgk+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojNWE1YTVhO30NCjwvc3R5bGU+DQo8Zz4NCgk8dGl0bGU+aWNvbl9kYXRhLXNvdXJjZTwvdGl0bGU+DQoJPGc+DQoJCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0tMTc0LjUsOTQuM2MtNS41LDAtMTAuMi0xLjYtMTIuMy00Yy0wLjEsMC4zLTAuMiwwLjYtMC4yLDFjMCwzLjIsNS43LDYsMTIuNSw2czEyLjUtMi43LDEyLjUtNg0KCQkJYzAtMC4zLTAuMS0wLjctMC4yLTFDLTE2NC40LDkyLjctMTY5LDk0LjMtMTc0LjUsOTQuM3oiLz4NCgkJPHBhdGggY2xhc3M9InN0MCIgZD0iTS0xNzQuNSw4OC45Yy01LjUsMC0xMC4yLTEuNi0xMi4zLTRjLTAuMSwwLjMtMC4yLDAuNi0wLjIsMWMwLDMuMiw1LjcsNiwxMi41LDZzMTIuNS0yLjcsMTIuNS02DQoJCQljMC0wLjMtMC4xLTAuNy0wLjItMUMtMTY0LjQsODcuMy0xNjksODguOS0xNzQuNSw4OC45eiIvPg0KCQk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNLTE4Nyw4MC40YzAsMy4yLDUuNyw2LDEyLjUsNnMxMi41LTIuNywxMi41LTZzLTUuNy02LTEyLjUtNlMtMTg3LDc3LjEtMTg3LDgwLjR6Ii8+DQoJPC9nPg0KPC9nPg0KPC9zdmc+DQo=';
      case 'app':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMi45NzgiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyMi45NzggMjUiPjx0aXRsZT5pY29uX2FwcHM8L3RpdGxlPjxwYXRoIGQ9Ik0yMS4yMjQgMTEuMjFhMS43NiAxLjc2IDAgMCAwLTEuNjgyIDEuMjU3SDE0Ljg5YTQuMjMgNC4yMyAwIDAgMC0uMy0xLjE0MmwzLjExNC0xLjhBMi4wNSAyLjA1IDAgMSAwIDE3LjEyIDguMWExLjk4NiAxLjk4NiAwIDAgMCAuMDguNTY1bC0zLjExOCAxLjhhNC4yNDMgNC4yNDMgMCAwIDAtLjgzNS0uODM1bC41ODYtMS4wMTVhMi4xNjUgMi4xNjUgMCAwIDAgLjU5My4wODYgMi4xMTYgMi4xMTYgMCAxIDAtMS40NS0uNThsLS41OCAxLjAxMmEzLjk1NSAzLjk1NSAwIDAgMC0xLjE0LS4zVjMuMDA4YTEuNTQ3IDEuNTQ3IDAgMSAwLTEgMHY1LjgxN2E0LjIzIDQuMjMgMCAwIDAtMS4xNDMuM2wtMi4wNi0zLjU2MkExLjY4NCAxLjY4NCAwIDAgMCA3LjUxIDQuNGExLjcxIDEuNzEgMCAxIDAtMS4zMiAxLjY2bDIuMDYgMy41N2E0LjMyMyA0LjMyMyAwIDAgMC0uODQzLjg0M2wtMy41NjYtMi4wNmExLjc2IDEuNzYgMCAwIDAgLjA0NS0uMzkgMS43IDEuNyAwIDEgMC0xLjcgMS43IDEuNjg2IDEuNjg2IDAgMCAwIDEuMTU1LS40NTNsMy41NyAyLjA2YTQuMDkgNC4wOSAwIDAgMC0uMyAxLjEzM0g1LjIwNmEyLjMwNSAyLjMwNSAwIDEgMCAwIDFoMS40MDdhNC4yMyA0LjIzIDAgMCAwIC4zIDEuMTQyTDMuMTAyIDE2LjhhMS44MjMgMS44MjMgMCAxIDAgLjU1IDEuMyAxLjc3NSAxLjc3NSAwIDAgMC0uMDYzLS40MzhsMy44MjItMi4yMDZhNC4yIDQuMiAwIDAgMCAuODQzLjg0bC0yLjk4IDUuMTkzYTEuNzI3IDEuNzI3IDAgMCAwLS40MTMtLjA1IDEuNzggMS43OCAwIDEgMCAxLjI3Ny41NGwyLjk4LTUuMTc4YTQuMDkgNC4wOSAwIDAgMCAxLjEzMy4zdjEuNDA4YTIuMDU1IDIuMDU1IDAgMSAwIC45OSAwVjE3LjFhNC4yMyA0LjIzIDAgMCAwIDEuMTQzLS4zbDIuNDYgNC4yNmExLjgyNCAxLjgyNCAwIDEgMCAxLjMwNi0uNTUyIDEuNzc4IDEuNzc4IDAgMCAwLS40NDYuMDU3bC0yLjQ2LTQuMjY1YTMuOTYgMy45NiAwIDAgMCAuODI2LS44MjdsLjQ0Ni4yNThhMi4zMjQgMi4zMjQgMCAwIDAtLjEyLjczOCAyLjQgMi40IDAgMSAwIC42Mi0xLjZsLS40NDMtLjI1NGE0LjE1NSA0LjE1NSAwIDAgMCAuMzEtMS4xNTRoNC42NmExLjc1MyAxLjc1MyAwIDEgMCAxLjY4LTIuMjV6bTAgMi43MWEuOTU4Ljk1OCAwIDEgMSAuOTU4LS45NTguOTYuOTYgMCAwIDEtLjk1OC45NnpNMTAuNzUgMTYuMTRhMy4xNzcgMy4xNzcgMCAxIDEgMy4xNzctMy4xNzggMy4xOCAzLjE4IDAgMCAxLTMuMTc3IDMuMTc3em03LjE2My04LjA0YTEuMjYgMS4yNiAwIDEgMSAxLjI2IDEuMjYgMS4yNiAxLjI2IDAgMCAxLTEuMjYtMS4yNnpNMTUuNzQgNi41OTRhMS4zMTQgMS4zMTQgMCAxIDEtMS4zMTUtMS4zMTQgMS4zMTUgMS4zMTUgMCAwIDEgMS4zMTQgMS4zMTR6TTkuOTk2IDEuNTQ4YS43NTMuNzUzIDAgMSAxIC43NTMuNzUzLjc1NC43NTQgMCAwIDEtLjc1My0uNzUyek00Ljg5NyA0LjRhLjkxLjkxIDAgMSAxIC45MS45MS45MS45MSAwIDAgMS0uOTEtLjkxek0yLjE5IDguOTM2YS45MS45MSAwIDEgMSAuOTA4LS45MS45MS45MSAwIDAgMS0uOTEuOTF6bS43NyA1LjUyNmExLjUwNiAxLjUwNiAwIDEgMSAxLjUwNS0xLjUwNiAxLjUwOCAxLjUwOCAwIDAgMS0xLjUwOCAxLjUwNnptLS4xIDMuNjQ2YTEuMDMyIDEuMDMyIDAgMSAxLTEuMDMzLTEuMDMyIDEuMDMzIDEuMDMzIDAgMCAxIDEuMDMyIDEuMDMyem0yLjk4NyA1LjExYS45ODYuOTg2IDAgMSAxLS45ODYtLjk4Ny45ODcuOTg3IDAgMCAxIC45ODcuOTg3em00LjktMS40NmExLjI2IDEuMjYgMCAxIDEgMS4yNi0xLjI2IDEuMjYgMS4yNiAwIDAgMS0xLjI1NyAxLjI2em02LjQ0Mi41N2ExLjAzMiAxLjAzMiAwIDEgMS0xLjAzMy0xLjAyOCAxLjAzMyAxLjAzMyAwIDAgMSAxLjAzMiAxLjAyOHptLS40LTcuNDU4YTEuNiAxLjYgMCAxIDEtMS42IDEuNiAxLjYgMS42IDAgMCAxIDEuNi0xLjZ6IiBmaWxsPSIjODk4OTg5Ii8+PC9zdmc+';
      default:
        return undefined;
    }
  })(typeCode);

  return imageUrl ? (
    <div
      className={css`
        display: inline-block;
        background-image: url(${imageUrl});
        background-size: ${size}px;
        background-repeat: no-repeat;
        width: ${size}px;
        height: ${size}px;
      `}
    />
  ) : null;
};
