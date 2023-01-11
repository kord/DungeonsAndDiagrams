import {Location, Size} from "./types";
import {locations} from "./graphUtils";


// type GridComponentType = 'speck' | 'verticalEdge' | 'horizontalEdge' | 'node';
// type GridComponent = {
//     gridComponentType: GridComponentType,
//     speckEdges?:Edge[],
//     edge?: Edge,
//     node?: Location,
// }
//
// type Edge = [Location, Location];
// type Speck = {
//     relevantEdges: Edge[];
// }
// type VerticalEdge = Edge;
// type HorizontalEdge = Edge;
// type NodeComponent = Location;

type Edge = [Location, Location];

export type GridComponent = NodeInfo | HorizontalEdgeInfo | VerticalEdgeInfo | Speck;

export class NodeInfo {
    myType = 'NodeInfo';

    constructor(public readonly loc: Location) {
    }
}

export class HorizontalEdgeInfo {
    myType = 'HorizontalEdgeInfo';

    constructor(public readonly edge: Edge, public boundary: boolean) {
    }
}

export class VerticalEdgeInfo {
    myType = 'VerticalEdgeInfo';

    constructor(public readonly edge: Edge, public boundary: boolean) {
    }
}

// Specks are the little square dots where the lines separating grid squares avoid touching each other.
// They're a nuisance, but needed for the thing to look halfway decent.
export class Speck {
    myType = 'Speck';
    public readonly relevantEdges: Edge[];
    public readonly boundary: boolean;
    public readonly corner: boolean;

    constructor(public readonly loc: Location, size: Size) {
        const {x, y} = this.loc;
        this.relevantEdges = [];
        if (loc.x != 0) this.relevantEdges.push([{x: x - 1, y: y - 1}, {x: x - 1, y: y}]); // Left edge
        if (loc.y != 0) this.relevantEdges.push([{x: x - 1, y: y - 1}, {x: x, y: y - 1}]); // Up edge
        if (loc.x != size.width) this.relevantEdges.push([{x: x, y: y - 1}, {x: x, y: y}]); // Right edge
        if (loc.y != size.height) this.relevantEdges.push([{x: x - 1, y: y}, {x: x, y: y}]); // Down edge
        this.boundary = this.relevantEdges.length < 4;
        this.corner = this.relevantEdges.length == 2;
    }
}


function edgeRowInfo(lowRow: number, size: Size) {
    const ret = [];
    const highRow = (lowRow - 1 + size.height) % size.height;
    const boundary = lowRow == 0;

    for (let i = 0; i < size.width; i += 1) {
        ret.push('speck');
        ret.push(new HorizontalEdgeInfo([{x: i, y: highRow}, {x: i, y: lowRow}], boundary));
    }
    ret.push('speck');

    return ret;
}

function SpecksOnly(size: Size) {
    const ret = [];
    return locations({height: size.height + 1, width: size.width + 1}).flat().map(loc => new Speck(loc, size));
}

function nodeRowInfo(rowNum: number, size: Size) {
    const ret = [];
    for (let i = 0; i < size.width; i += 1) {
        ret.push(new VerticalEdgeInfo([{x: i, y: rowNum}, {x: (i - 1 + size.width) % size.width, y: rowNum}], i == 0));
        ret.push(new NodeInfo({x: i, y: rowNum}));
    }
    ret.push(new VerticalEdgeInfo([{x: size.width - 1, y: rowNum}, {x: 0, y: rowNum}], true));
    return ret;
}

export function expandedGrid(size: Size) {
    const ret = [];
    for (let j = 0; j < size.height; j += 1) {
        // Set the top edge-row
        ret.push(edgeRowInfo(j, size));
        // Set the top node-row
        ret.push(nodeRowInfo(j, size));
    }
    // Bottom edge-row same as the top.
    ret.push(edgeRowInfo(0, size));

    // The construction of the specks is easier to do all at once instead of interleaved with the other things.
    // After making them here, we slot them into the slots prepared in edgeRowInfo and nodeRowInfo as the string
    // 'speck' in the right order placement.
    const specks = SpecksOnly(size);

    const realret: GridComponent[] = [];
    ret.flat().forEach(item => {
        if (typeof item == 'string') realret.push(specks.shift()!);
        else realret.push(item);
    });
    return realret;
}
