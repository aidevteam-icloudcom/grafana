/**
 * Various helper functions to modify (immutably) the route tree, aka "notification policies"
 */

import { produce } from 'immer';
import { omit } from 'lodash';

import { Route, RouteWithID } from 'app/plugins/datasource/alertmanager/types';

import { FormAmRoute } from '../types/amroutes';

import { formAmRouteToAmRoute } from './amroutes';

// add a form submission to the route tree
export const mergePartialAmRouteWithRouteTree = (
  alertManagerSourceName: string,
  partialFormRoute: Partial<FormAmRoute>,
  routeTree: RouteWithID
): Route => {
  const existing = findExistingRoute(partialFormRoute.id ?? '', routeTree);
  if (!existing) {
    throw new Error(`No such route with ID '${partialFormRoute.id}'`);
  }

  function findAndReplace(currentRoute: RouteWithID): Route {
    let updatedRoute: Route = currentRoute;

    if (currentRoute.id === partialFormRoute.id) {
      const newRoute = formAmRouteToAmRoute(alertManagerSourceName, partialFormRoute, routeTree);
      updatedRoute = omit(
        {
          ...currentRoute,
          ...newRoute,
        },
        'id'
      );
    }

    return omit(
      {
        ...updatedRoute,
        routes: currentRoute.routes?.map(findAndReplace),
      },
      'id'
    );
  }

  return findAndReplace(routeTree);
};

// remove a route from the policy tree, returns a new tree
// make sure to omit the "id" because Prometheus / Loki / Mimir will reject the payload
export const omitRouteFromRouteTree = (findRoute: RouteWithID, routeTree: RouteWithID): Route => {
  if (findRoute.id === routeTree.id) {
    throw new Error('You cant remove the root policy');
  }

  function findAndOmit(currentRoute: RouteWithID): Route {
    return omit(
      {
        ...currentRoute,
        routes: currentRoute.routes?.reduce((acc: Route[] = [], route) => {
          if (route.id === findRoute.id) {
            return acc;
          }

          acc.push(findAndOmit(route));
          return acc;
        }, []),
      },
      'id'
    );
  }

  return findAndOmit(routeTree);
};

export type InsertPosition = 'above' | 'below' | 'child';

// add a new route to a parent route
export const addRouteToReferenceRoute = (
  alertManagerSourceName: string,
  partialFormRoute: Partial<FormAmRoute>,
  referenceRoute: RouteWithID,
  routeTree: RouteWithID,
  position: InsertPosition
): Route => {
  const newRoute = formAmRouteToAmRoute(alertManagerSourceName, partialFormRoute, routeTree);

  return produce(routeTree, (draftTree) => {
    const [routeInTree, parentRoute, positionInParent] = findRouteInTree(draftTree, referenceRoute);

    if (routeInTree === undefined || parentRoute === undefined || positionInParent === undefined) {
      throw new Error(`could not find reference route "${referenceRoute.id}" in tree`);
    }

    // if user wants to insert new child policy, append to the bottom of children
    if (position === 'child') {
      routeInTree.routes = routeInTree.routes?.concat(newRoute);
    }

    // insert new policy before / above the referenceRoute
    if (position === 'above') {
      parentRoute.routes = insertBefore(parentRoute.routes ?? [], newRoute, positionInParent);
    }

    // insert new policy after / below the referenceRoute
    if (position === 'below') {
      parentRoute.routes = insertAfter(parentRoute.routes ?? [], newRoute, positionInParent);
    }
  });
};

type RouteMatch = Route | undefined;

function findRouteInTree(
  routeTree: RouteWithID,
  referenceRoute: RouteWithID
): [matchingRoute: RouteMatch, parentRoute: RouteMatch, positionInParent: number | undefined] {
  let matchingRoute: RouteMatch;
  let matchingRouteParent: RouteMatch;
  let matchingRoutePositionInParent: number | undefined;

  // recurse through the tree to find the matching route, its parent and the position of the route in the parent
  function findRouteInTree(currentRoute: RouteWithID, index: number, parentRoute: RouteWithID) {
    if (currentRoute.id === referenceRoute.id) {
      matchingRoute = currentRoute;
      matchingRouteParent = parentRoute;
      matchingRoutePositionInParent = index;
    }

    if (currentRoute.routes) {
      currentRoute.routes.forEach((route, index) => findRouteInTree(route, index, currentRoute));
    }
  }

  findRouteInTree(routeTree, 0, routeTree);

  return [matchingRoute, matchingRouteParent, matchingRoutePositionInParent];
}

export function findExistingRoute(id: string, routeTree: RouteWithID): RouteWithID | undefined {
  return routeTree.id === id ? routeTree : routeTree.routes?.find((route) => findExistingRoute(id, route));
}

function insertBefore<T>(array: T[], item: T, index: number): T[] {
  if (index < 0 || index > array.length) {
    throw new Error('Index out of bounds');
  }

  // Use the spread operator to create a new array with the item inserted at the specified index
  const newArray = [...array.slice(0, index), item, ...array.slice(index)];

  return newArray;
}

function insertAfter<T>(array: T[], item: T, index: number): T[] {
  return insertBefore(array, item, index + 1);
}
