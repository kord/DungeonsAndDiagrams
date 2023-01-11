import {countConnectedComponents} from 'graphology-components';
import Graph from 'graphology';
import {Location, Size} from "./types";
import {has2x2Block, hasSingleLongestPath, longestPathTerminalPairs} from "./graphProperties";
import {consolidateNodes, gridNeighbourFunc, loc2Str, locations, locFromStr, shuffle} from "./graphUtils";

type BoardStyle = 'block' | 'thin edges' | 'blank';

export interface WrapRules {
    wrapX: boolean,
    wrapY: boolean
}

export const toroidalEmbedding: WrapRules = {wrapX: true, wrapY: true};

export type BoardgenRules = {
    // How big is the board.
    size: Size,
    // Which style of board is being generated.
    style: BoardStyle,

    // Prevents generation of boards without a unique pair of max-distance nodes.
    uniqueDiameter?: boolean,

    // Are the nodes connected across the top or sides of the board?
    wrap: WrapRules,

    // Prevents any 2x2 block of nodes from being generated.
    // This is ignored in the 'thin edges' BoardStyle.
    no2x2?: boolean,

    // Always ensure that the board's nodes remain in a single connected component.
    singleConnectedComponent?: boolean,
}

export const defaultBoardgenRules: BoardgenRules = {
    size: {width: 8, height: 8},
    style: "block",
    wrap: {wrapX: false, wrapY: false},
    uniqueDiameter: false,
    no2x2: true,
    singleConnectedComponent: true,
}

// Some quantitative property tracked for every row and every column of a grid.
type Linestats = {
    rows: Array<number>,
    cols: Array<number>,
}

export type BlockBoard = {
    // The rules that were used to generate this board.
    rules: BoardgenRules,
    graph: Graph,
    // degrees[n] is an array of all nodes that each have precisely n edges.
    degrees: Array<Array<string>>,
    maxDistancePairs: Array<Array<string>>,
    presentNodeCounts: Linestats,
    presentEdgeCounts: Linestats,
    absentNodeCounts: Linestats,
    absentEdgeCounts: Linestats,
    restarts: number,
}

// TODO
function getLineStats(g: Graph, size: Size) {
    let presentNodeCounts = [], presentEdgeCounts = [], absentNodeCounts = [], absentEdgeCounts = [];
    for (let i = 0; i < size.height; i++) {
        presentNodeCounts.push()
    }

    const dummy = {rows: [], cols: []};

    return {
        presentNodeCounts: dummy,
        presentEdgeCounts: dummy,
        absentNodeCounts: dummy,
        absentEdgeCounts: dummy,
    }
}


export function generateBoard(rules: BoardgenRules) {
    let g: Graph;
    // let throneresult = installThroneRooms(g, rules);

    let rejected = true;
    let rejects = 0;
    const rejection = (g: Graph) => (
        (rules.no2x2 && rules.style == "block" && has2x2Block(g, rules.size)) ||
        (rules.uniqueDiameter && !hasSingleLongestPath(g)));
    while (rejected) {
        rejected = false;
        g = unconstrainedGridGraph(rules.size, rules.wrap);

        switch (rules.style) {
            case "block":
                g = findBlockBoard(g, rules);
                break;
            case "thin edges":
                g = findThinEdgesBoard(g, rules);
                break;
            case 'blank':
                break;
        }

        if (rules.style != 'blank' && rejection(g!)) {
            rejected = true;
            rejects += 1;
        }

        if (rejects > 500) {
            console.error('Too many rejects!!!');
            // Return whatever we have though.
            break;
        }
    }


    // {
    //     const rando = (n: number) => Math.floor(Math.random() * n);
    //     const maxTries = 500;
    //     let attempts = 0;
    //     while (attempts < maxTries) {
    //         if (installThroneRoom(g,
    //             {x: rando(size.width - 2), y: rando(size.height - 2)},
    //             size,
    //             'block')) break;
    //         attempts++;
    //     }}


    let degrees: Array<Array<string>> = [[], [], [], [], []];
    g!.forEachNode(n => degrees[g.degree(n)].push(n));

    let maxDistancePairs = longestPathTerminalPairs(g!);

    console.log(`Rejected: ${rejects}`);
    return {
        rules: rules,
        graph: g!,
        degrees: degrees,
        maxDistancePairs: maxDistancePairs,
        ...getLineStats(g!, rules.size),
        restarts: rejects,
    } as BlockBoard;
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

function findBlockBoard(g: Graph, rules: BoardgenRules): Graph {
    // With a block style board, we make nodes inaccessible until we're happy.

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

function findThinEdgesBoard(g: Graph, rules: BoardgenRules): Graph {
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

// Grab a bunch of grid locations in a rectangle.
function gridBlock(loc: Location, size: Size) {
    const {height, width} = size;
    const ret = [];
    for (let j = loc.y; j < loc.y + height; j += 1) {
        for (let i = loc.x; i < loc.x + width; i += 1) {
            ret.push({x: i, y: j} as Location);
        }
    }
    return ret;
}

// Take a grid graph and merge a group of sizexsize nodes whose top-left element is at loc, then remove all but one
// of the neighbouring edges so it's connected to the main.
// eg. ..... (1,1) size 2 .....
//     .....              .ox..
//     .....      ==>     .xx..
//     .....              .....
//     .....              .....
// o is now connected to all of the original block's members and the x nodes are purged.
export function installThroneRoom(g: Graph, loc: Location, size: Size, boardStyle: BoardStyle): [Location, Location] | undefined {
    let group = gridBlock(loc, size);
    if (group.some(loc => !g.hasNode(loc2Str(loc)))) return undefined;
    const representative = consolidateNodes(g, group.map(loc2Str));
    const neighbours = g.neighbors(representative);

    // Only one exit from the throne room.
    const exitNode = neighbours.splice(Math.floor(Math.random() * neighbours.length), 1);

    if (boardStyle == 'block') {
        neighbours.forEach(n => g.dropNode(n));
        group.forEach(loc => g.mergeNode(loc2Str(loc)))
    } else if (boardStyle == 'thin edges') {
        neighbours.forEach(n => g.dropEdge(representative, n));
    } else {
        console.error('You forgot to tell installThroneRoom about a new BoardStyle')
    }
    const repString = locFromStr(representative);
    if (!repString) return undefined;
    return [loc, repString];
}
