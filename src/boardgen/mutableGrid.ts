import {Linestats, Location, Size} from "./types";
import {gridLocations, gridNeighbourFunc} from "./graphUtils";

// A class representing an arbitrary size grid of bools, with the handy feature that you can roll back changes
// easily to the last time you declared it 'safe.'
export class MutableGrid {
    currentlySafe: boolean;
    nf: (loc: Location) => Location[];
    private grid: boolean[][];
    private lastSafe: boolean[][];

    constructor(public size: Size, initialValue: boolean) {
        this.grid = constantGrid(size, initialValue);
        this.lastSafe = constantGrid(size, initialValue);
        this.currentlySafe = true;
        this.nf = gridNeighbourFunc(size, {wrapX: false, wrapY: false});
    }

    check(loc: Location): boolean {
        console.assert(loc.x >= 0 && loc.y >= 0 && loc.y < this.size.height && loc.x < this.size.width);
        return this.grid[loc.y][loc.x];
    }

    setLoc(loc: Location, value: boolean) {
        console.assert(loc.x >= 0 && loc.y >= 0 && loc.y < this.size.height && loc.x < this.size.width);
        const previousValue = this.grid[loc.y][loc.x];

        // Jump out if it's not even a change.
        if (previousValue == value) return;

        this.grid[loc.y][loc.x] = value;
        this.currentlySafe = false;
    }

    markSafe() {
        this.currentlySafe = true;
        this.lastSafe = this.grid.map(row => row.map(b => b));
    }

    revert() {
        if (this.currentlySafe) return;
        this.grid = this.lastSafe.map(row => row.map(b => b));
        this.currentlySafe = true;
    }

    trueLocs(value = true): Location[] {
        const ret = [];
        for (let j = 0; j < this.size.height; j++) {
            for (let i = 0; i < this.size.width; i++) {
                if (this.grid[j][i] == value) ret.push({x: i, y: j});
            }
        }
        return ret;
    }

    // Find the first location of a true element in the grid, starting in the top-left and scanning across rows first.
    firstTrue(startloc: Location = {x: 0, y: 0}): Location | undefined {
        const ret = [];
        // Only use a nonzero start for out x-coordinate the first time through.
        let iStart = startloc.x;
        for (let j = startloc.y; j < this.size.height; j++) {
            for (let i = iStart; i < this.size.width; i++) {
                if (this.grid[j][i]) return ({x: i, y: j});
            }
            iStart = 0;
        }
    }

    componentCount = () => this.componentSizes().length;

    // Return the sizes of the manhattan-adjacent connected components, starting with the smallest.
    componentSizes(): number[] {
        const backup = this.grid.map(row => row.map(b => b));
        const ret = [];

        while (true) {
            const seed = this.firstTrue();
            if (seed === undefined) break;

            let componentSize = 0;
            const todo = [seed];
            while (todo.length > 0) {
                const cur = todo.pop()!;
                if (!this.check(cur!)) continue;
                this.setLoc(cur, false);
                componentSize++;
                todo.push(...this.nf(cur));
            }
            ret.push(componentSize);
        }

        // Restore before we started messing with it.
        this.grid = backup;
        return ret.sort((a, b) => a - b);
    }

    // Return the locations of the manhattan-adjacent connected components, starting with the smallest.
    connectedComponents(): Location[][] {
        const backup = this.grid.map(row => row.map(b => b));
        const ret = [];

        while (true) {
            const seed = this.firstTrue();
            if (seed === undefined) break;

            let component = [];
            const todo = [seed];
            while (todo.length > 0) {
                const cur = todo.pop()!;
                if (!this.check(cur!)) continue;
                // We set to false and add to our list at the same time so this works.
                this.setLoc(cur, false);
                component.push(cur);
                // Set ourselves up to examine the neighbours.
                todo.push(...this.nf(cur));
            }
            ret.push(component);
        }

        // Restore before we started falsing everything out.
        this.grid = backup;
        return ret.sort((a, b) => a.length - b.length);
    }

    // Returns true iff a block with top-left corner loc and size size has all true values in the grid.
    checkBlock(loc: Location, size: Size) {
        if (loc.x + size.width > this.size.width || loc.y + size.height > this.size.height) return false;
        for (let j = 0; j < size.height; j++)
            for (let i = 0; i < size.width; i++) {
                if (!this.check({x: loc.x + i, y: loc.y + j})) return false;
            }
        return true;
    }

    neighbourCount = (loc: Location) => this.nf(loc).filter(n => this.check(n)).length;
    isLeaf = (loc: Location) => (this.check(loc) && this.neighbourCount(loc) == 1);
    leaves = () => gridLocations(this.size).flat().filter(this.isLeaf);

    // Print the grid to
    show() {
        const leafChar = 'o';
        const emptyChar = '.';
        const wallChar = 'x';

        const ret = [];
        for (let j = 0; j < this.size.height; j++) {
            const row = [];
            for (let i = 0; i < this.size.width; i++) {
                const loc = {x: i, y: j};
                if (!this.check(loc)) row.push(wallChar);
                else {
                    row.push(this.isLeaf(loc) ? leafChar : emptyChar);
                }
            }
            ret.push(row.join(''));
        }
        console.log(ret.join('\n'));
        // console.log(`${this.componentSizes()} componentsizes.`)
        console.log(`${this.leaves().length} leaves.`)
    }

    // Get counts for the rows and columns having the given value.
    profile(value: boolean): Linestats {
        const rows = constantArray(this.size.height, 0);
        const cols = constantArray(this.size.width, 0);

        for (let j = 0; j < this.size.height; j++) {
            for (let i = 0; i < this.size.width; i++) {
                if (this.grid[j][i] === value) {
                    rows[j]++;
                    cols[i]++
                }
            }
        }
        return {rows: rows, cols: cols,}
    }

    copy(): MutableGrid {
        const ret = new MutableGrid(this.size, false);
        ret.grid = this.grid.map(row => row.map(b => b));
        ret.lastSafe = this.lastSafe.map(row => row.map(b => b));
        ret.currentlySafe = this.currentlySafe;
        return ret;
    }

    // Check whether all of the current values are the same for this and another MutableGrid.
    equals(other: MutableGrid): boolean {
        // Grids have the be the same size to be equal.
        if (!(this.size.height == other.size.height && this.size.width == other.size.width)) return false;
        for (let j = 0; j < this.size.height; j++) {
            for (let i = 0; i < this.size.width; i++) {
                const loc = {x: i, y: j,};
                if (this.check(loc) != other.check(loc)) return false;
            }
        }
        return true;
    }
}


export function constantArray<T>(size: number, value: T): T[] {
    const row = [];
    for (let i = 0; i < size; i++) {
        row.push(value);
    }
    return row;
}

export function constantGrid<T>(size: Size, value: T): T[][] {
    const ret = [];
    for (let j = 0; j < size.height; j++) {
        ret.push(constantArray(size.width, value));
    }
    return ret;
}
