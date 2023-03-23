import {MutableGrid} from "./mutableGrid";

export type Size = {
    height: number,
    width: number,
}

export type Location = {
    x: number,
    y: number,
};

// Some quantitative property tracked for every row and every column of a grid.
export type Linestats = {
    rows: Array<number>,
    cols: Array<number>,
}

// The minimal presentation of a puzzle solution. Just a record of the wall locations and a redundant
// specification of where the treasure rooms are located.
export type SolnRecord = {
    walls: MutableGrid,
    treasures: Location[],
}

export type RangeReport = {
    order: number,
    orientation: 'row' | 'col',
    size: number,
    required: number,
    userWallCount: number,
    userFloorCount: number,
    treasureCount: number,
    deadEndCount: number,
}