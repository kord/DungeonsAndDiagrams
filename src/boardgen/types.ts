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