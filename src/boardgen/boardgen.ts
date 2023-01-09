import {countConnectedComponents} from 'graphology-components';
import Graph from 'graphology';
import {bidirectional} from 'graphology-shortest-path/unweighted';
import {diameter} from "graphology-metrics/graph";
import {Location, Size} from "./types";

type BoardStyle = 'block' | 'thin edges';

interface WrapRules {
    wrapX: boolean,
    wrapY: boolean
}

export const toroidalEmbedding: WrapRules = {wrapX: true, wrapY: false};

type BoardgenRules = {
    // How big is the board.
    size: Size,
    // Which style of board is being generated.
    style: BoardStyle,

    // Prevents generation of boards without a unique pair of max-distance nodes.
    uniqueDiameter: boolean,

    // Are the nodes connected across the top or sides of the board?
    wrap: WrapRules,

    // Prevents any 2x2 block of nodes from being generated.
    // This is ignored in the 'thin edges' BoardStyle.
    no2x2: boolean,


}

export type BlockBoard = {
    rules: BoardgenRules,
    graph: Graph,
    // degrees[n] is an array of all nodes that each have precisely n edges.
    degrees: Array<Array<string>>,
    maxDistancePairs: Array<Array<string>>,
    restarts: number,
}


function generateBoard(rules: BoardgenRules) {
    let g: Graph;
    let rejected = true;
    let rejects = 0;

    const rejection = (g: Graph) => (
        (rules.no2x2 && rules.style == "block" && has2x2Block(g, rules.size)) ||
        (rules.uniqueDiameter && !hasSingleLongestPath(g)));

    while (rejected) {
        rejected = false;

        switch (rules.style) {
            case "block":
                g = findBlockBoard(rules);
                break;
            case "thin edges":
                g = findThinEdgesBoard(rules);
        }

        if (rejection(g)) {
            rejected = true;
            rejects += 1;
        }
    }

    let degrees: Array<Array<string>> = [[], [], [], [], []];
    g!.forEachNode(n => degrees[g.degree(n)].push(n));

    let maxDistancePairs = longestPathTerminalPairs(g!);

    console.log(`Rejected: ${rejects}`);
    return {
        rules: rules,
        graph: g!,
        degrees: degrees,
        maxDistancePairs: maxDistancePairs,
        restarts: rejects,
    } as BlockBoard;

}


export function loc2Str(loc: Location) {
    return `${loc.x},${loc.y}`;
}

function unconstrainedGridGraph(size: Size, wrapRules: WrapRules) {
    const graph = new Graph({type: 'undirected', allowSelfLoops: false});
    locations(size).flat().forEach(loc => {
        const cur = loc2Str(loc);
        graph.addNode(cur, {x: loc.x, y: loc.y});
    });

    const neighbours = gridNeighbourFunc(size, wrapRules);
    locations(size).flat().forEach(loc => {
        const cur = loc2Str(loc);
        neighbours(loc).forEach(n => graph.updateEdge(cur, loc2Str(n)));
    });

    // Now we have a graph with all of the grid nodes and all edges between neighbours.
    return graph;
}

export function locations(size: Size): Location[][] {
    let ret = [];
    for (let j = 0; j < size.height; j += 1) {
        const row = [];
        for (let i = 0; i < size.width; i += 1) {
            row.push({x: i, y: j});
        }
        ret.push(row);
    }
    return ret;
}

let gridNeighbourFunc = (size: Size, wrapRules: WrapRules) => {
    // toLargerOnly allows us to avoid duplicate generating the undirected edges, only edges proceeding to "larger"
    // nodes are returned.
    const {wrapX, wrapY} = wrapRules;
    return (loc: Location) => {
        let candidates =
            [
                {x: loc.x, y: loc.y + 1},
                {x: loc.x, y: loc.y - 1},
                {x: loc.x + 1, y: loc.y},
                {x: loc.x - 1, y: loc.y}
            ];
        if (wrapX) candidates = candidates.map(loc => ({x: loc.x % size.width, y: loc.y}))
        if (wrapY) candidates = candidates.map(loc => ({x: loc.x, y: loc.y % size.height}))
        return candidates.filter(
            (loc: Location) => loc.x >= 0 && loc.y >= 0 && loc.x < size.width && loc.y < size.height);
    }
}

function findBlockBoard(rules: BoardgenRules): Graph {
    const g = unconstrainedGridGraph(rules.size, rules.wrap);

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

function shuffle(array: Array<any>) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function findThinEdgesBoard(rules: BoardgenRules): Graph {
    const g = unconstrainedGridGraph(rules.size, rules.wrap);

    // With an edges style board, we make edges inaccessible until we're happy.

    const edges = g.edges().map(s => s);
    const edgeOrder = shuffle(edges);

    // Consider removing each edge in turn, in a random order.
    edgeOrder.forEach(e => {
        const nodes = g.extremities(e);
        g.dropEdge(e);
        // We have to return it if the graph splits due to the removal.
        if (countConnectedComponents(g) > 1) g.addEdge(nodes[0], nodes[1]);
    });

    return g;
}

function has2x2Block(g: Graph, size: Size) {
    return locations(size).flat().some(loc => {
        const block = [
            {x: loc.x, y: loc.y},
            {x: loc.x + 1, y: loc.y},
            {x: loc.x + 1, y: loc.y + 1},
            {x: loc.x, y: loc.y + 1},
        ];
        return block.every(l => g.hasNode(loc2Str(l)));
    })
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

function longestPathTerminalPairs(g: Graph) {
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