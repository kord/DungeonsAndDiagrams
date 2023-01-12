import Graph from "graphology";
import {Size} from "./types";
import {diameter} from "graphology-metrics/graph";
import {bidirectional} from "graphology-shortest-path/unweighted";
import {gridLocations, loc2Str} from "./graphUtils";

export function has2x2Block(g: Graph, size: Size) {
    return gridLocations(size).flat().some(loc => {
        const block = [
            {x: loc.x, y: loc.y},
            {x: loc.x + 1, y: loc.y},
            {x: loc.x + 1, y: loc.y + 1},
            {x: loc.x, y: loc.y + 1},
        ];
        return block.every(l => g.hasNode(loc2Str(l)));
    })
}

export function hasSingleLongestPath(g: Graph) {
    const graphWidth = diameter(g);

    let leafs = g.nodes().filter(n => g.degree(n) === 1);

    let maxFound = false;

    for (let i = 0; i < leafs.length; i++) {
        for (let j = i + 1; j < leafs.length; j++) {
            const source = leafs[i];
            const destination = leafs[j];
            const path = bidirectional(g, source, destination);

            if (path!.length > graphWidth) {
                if (maxFound) return false;
                maxFound = true;
            }
        }
    }
    return maxFound;
}

export function longestPathTerminalPairs(g: Graph) {
    let leafs = g.nodes().filter(n => g.degree(n) === 1);

    let maxDistancePairs = new Array<string[]>();
    const graphWidth = diameter(g);

    for (let i = 0; i < leafs.length; i++) {
        for (let j = i + 1; j < leafs.length; j++) {
            const source = leafs[i];
            const destination = leafs[j];
            const path = bidirectional(g, source, destination);

            if (path!.length > graphWidth) {
                maxDistancePairs.push([source, destination]);
            }
        }
    }
    return maxDistancePairs;
}