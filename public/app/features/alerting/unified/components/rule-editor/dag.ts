import { compact, memoize, uniq } from 'lodash';
import memoizeOne from 'memoize-one';

import { Edge, Graph, Node } from 'app/core/utils/dag';
import { isExpressionQuery } from 'app/features/expressions/guards';
import { AlertQuery } from 'app/types/unified-alerting-dto';

// memoized version of _createDagFromQueries to prevent recreating the DAG if no sources or targets are modified
export const createDagFromQueries = memoizeOne(
  _createDagFromQueries,
  (previous: Parameters<typeof _createDagFromQueries>, next: Parameters<typeof _createDagFromQueries>) => {
    return fingerPrintQueries(previous[0]) === fingerPrintQueries(next[0]);
  }
);

/**
 * Turn the array of alert queries (this means data queries and expressions)
 * in to a DAG, a directed acyclical graph
 */
export function _createDagFromQueries(queries: AlertQuery[]): Graph {
  const graph = new Graph();

  queries.forEach((query) => {
    const source = query.refId;
    const targets =
      isExpressionQuery(query.model) && query.model.type === 'math'
        ? parseTargetsFromMathExpression(query.model.expression ?? '')
        : query.model.expression
        ? [query.model.expression]
        : [];

    if (!graph.getNode(source)) {
      graph.createNode(source);
    }

    targets.forEach((target) => {
      const isSelf = source === target;

      if (source && target && !isSelf) {
        graph.link(target, source);
      }
    });
  });

  return graph;
}

/**
 * parse an expression like "$A > $B" or "${FOO BAR} > 0" to an array of refIds
 */
export function parseTargetsFromMathExpression(input: string): string[] {
  // we'll use two regular expressions, one for "${var}" and one for "$var"
  const r1 = new RegExp(/\$\{(?<var>[a-zA-Z0-9_]+?)\}/gm);
  const r2 = new RegExp(/\$(?<var>[a-zA-Z0-9_]+)/gm);

  const m1 = Array.from(input.matchAll(r1)).map((m) => m.groups?.var);
  const m2 = Array.from(input.matchAll(r2)).map((m) => m.groups?.var);

  return compact(uniq([...m1, ...m2]));
}

export const getOriginOfRefId = memoize(_getOriginOfRefId, (refId, graph) => refId + fingerprintGraph(graph));

export function _getOriginOfRefId(refId: string, graph: Graph): string | undefined {
  const node = graph.getNode(refId);

  let origin: Node | undefined;

  // recurse through "node > inputEdges > inputNode"
  function findChildNode(node: Node) {
    const inputEdges = node.inputEdges;

    if (inputEdges.length > 0) {
      inputEdges.forEach((edge) => {
        if (edge.inputNode) {
          findChildNode(edge.inputNode);
        }
      });
    } else {
      origin = node;
    }
  }

  findChildNode(node);

  return origin?.name;
}

// create a unique fingerprint of the DAG
export function fingerprintGraph(graph: Graph) {
  return Object.keys(graph.nodes)
    .map((name) => {
      const n = graph.nodes[name];
      let outputEdges = n.outputEdges.map((e: Edge) => e.outputNode?.name).join(', ');
      let inputEdges = n.inputEdges.map((e: Edge) => e.inputNode?.name).join(', ');
      return `${n.name}:${outputEdges}:${inputEdges}`;
    })
    .join(' ');
}

// create a unique fingerprint of the array of queries
export function fingerPrintQueries(queries: AlertQuery[]) {
  return queries.map((query) => query.refId + query.model.expression).join();
}
