import {countConnectedComponents} from 'graphology-components';
import Graph from 'graphology';
import {bidirectional} from 'graphology-shortest-path/unweighted';
import {diameter} from "graphology-metrics/graph";

export type Size = {
    height: number,
    width: number,
}

export type Location = {
    x: number,
    y: number,
};

type BoardStyle = 'block' | 'thin edges';

type BoardgenRules = {
    size: Size,
    style: BoardStyle,

    no2x2: boolean,
    uniqueDiameter: boolean,

}

export type BlockBoard = {
    size: Size,
    graph: Graph,
    degrees: Array<Array<string>>,
    maxDistancePairs: Array<Array<string>>,
}

export function loc2Str(loc: Location) {
    return `${loc.x},${loc.y}`;
}

function unconstrainedGridGraph(size: Size) {
    let graph = new Graph({allowSelfLoops: false, type: 'undirected'});
    locations(size).forEach(loc => {
        const cur = loc2Str(loc);
        graph.addNode(cur);
    });


    const neighbours = neighbourFunc(size);
    locations(size).forEach(loc => {
        const cur = loc2Str(loc);
        neighbours(loc, true).forEach(n => graph.addEdge(cur, loc2Str(n)));
    });

    // Now we have a graph with all of the grid nodes and all edges between neighbours.
    return graph;
}

export function locations(size: Size): Location[] {
    let ret = [];
    for (let i = 0; i < size.width; i += 1) {
        for (let j = 0; j < size.height; j += 1) {
            ret.push({x: i, y: j});
        }
    }
    return ret;
}

let neighbourFunc = (size: Size) => {
    // toLargerOnly allows us to avoid duplicate generating the undirected edges, only edges proceeding to "larger"
    // nodes are returned.
    return (loc: Location, toLargerOnly = false) => {
        let candidates = toLargerOnly ?
            [
                {x: loc.x, y: loc.y + 1},
                {x: loc.x + 1, y: loc.y},
            ] :
            [
                {x: loc.x, y: loc.y + 1},
                {x: loc.x + 1, y: loc.y},
                {x: loc.x, y: loc.y - 1},
                {x: loc.x - 1, y: loc.y}
            ];
        return candidates.filter(
            (loc: Location) => loc.x >= 0 && loc.y >= 0 && loc.x < size.width && loc.y < size.height);
    }
}

function findBlockBoard(rules: BoardgenRules): Graph {
    const g = unconstrainedGridGraph(rules.size);

    // With a block style board, we make nodes inaccessible until we're happy.

    // Don't delete leaf nodes.
    const nodes = g.nodes().map(s => s);
    const finished = [];
    const getRandomNode = () => Math.floor(Math.random() * nodes.length);

    while (nodes.length > 0) {
        const node = getRandomNode();
        const nodeName = nodes[node];

        // Leave leaves alone.
        const neighbours = g.neighbors(nodeName);

        if (neighbours.length > 1) {
            // See if we can drop the node and still have a single connected component.
            g.dropNode(nodeName);
            const count = countConnectedComponents(g);

            if (count > 1) {
                // We have to put our node back in.
                g.addNode(nodeName);
                neighbours.forEach(neighbour => g.addEdge(nodeName, neighbour));
            }
        }

        finished.push(nodeName);
        nodes.splice(node, 1);
    }

    return g;
}

function has2x2(g: Graph, size: Size) {
    return locations(size).some(loc => {
        const block = [
            {x: loc.x, y: loc.y},
            {x: loc.x + 1, y: loc.y},
            {x: loc.x, y: loc.y + 1},
            {x: loc.x + 1, y: loc.y + 1},
        ];
        return block.every(l => g.hasNode(loc2Str(l)));
    })
}


function generateBoard(rules: BoardgenRules) {
    let g: Graph;
    let rejected = true;
    let rejects = 0;

    const rejection = (g: Graph) => (
        (rules.no2x2 && has2x2(g, rules.size))
        ||
        (rules.uniqueDiameter && !hasSingleLongestPath(g)));

    while (rejected) {
        rejected = false;

        if (rules.style === 'block') {
            g = findBlockBoard(rules);
        } else {
            throw new Error('block only, so far')
        }

        if (rejection(g)) {
            rejected = true;
            rejects += 1;
        }
    }

    let degrees: Array<Array<string>> = [[], [], [], [], []];
    g!.forEachNode(n => degrees[g.degree(n)].push(n));

    let maxDistancePairs = longestPaths(g!);

    console.log(`Rejected: ${rejects}`);
    return {
        size: rules.size,
        graph: g!,
        degrees: degrees,
        maxDistancePairs: maxDistancePairs
    } as BlockBoard;

}

function hasSingleLongestPath(g: Graph) {
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

function longestPaths(g: Graph) {
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

export {generateBoard};