import {Linestats, Location, Size} from "./types";
import {gridLocations, gridNeighbourFunc, loc2Str, locFromStr} from "../boardgen/graphUtils";

type MaxDistance = {
    source: Location,
    destination: Location,
    distance: number,
}

// A class representing an arbitrary size grid of bools, with the handy feature that you can roll back changes
// easily to the last time you declared it 'safe.'
export class MutableGrid {
    currentlySafe: boolean;
    neighbourFunction: (loc: Location) => Location[];
    private grid: boolean[][];
    private lastSafe: boolean[][];

    constructor(public size: Size, initialValue: boolean) {
        this.grid = constantGrid(size, initialValue);
        this.lastSafe = constantGrid(size, initialValue);
        this.currentlySafe = true;
        this.neighbourFunction = gridNeighbourFunc(size);
    }

    static fromLocs(size: Size, thrones: Location[]): MutableGrid {
        const ret = new MutableGrid(size, false);
        thrones.forEach(l => ret.setLoc(l, true));
        return ret;
    }

    // Note that the previous grid's last safe state is not retained.
    public static fromString(size: Size, s: string): MutableGrid {
        const ret = new MutableGrid(size, false);
        const ss = atob(s);
        let codep = 0;
        gridLocations(size).flat().forEach((loc, i) => {
            if (i % 8 === 0) codep = ss.codePointAt(i / 8)!;
            const next = codep % 2 === 1;
            codep = Math.floor(codep / 2);
            ret.setLoc(loc, next);
        });
        ret.markSafe();
        return ret;
    }

    check(loc: Location): boolean {
        console.assert(loc.x >= 0 && loc.y >= 0 && loc.y < this.size.height && loc.x < this.size.width);
        return this.grid[loc.y][loc.x];
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

    setLoc(loc: Location, value: boolean) {
        console.assert(loc.x >= 0 && loc.y >= 0 && loc.y < this.size.height && loc.x < this.size.width);
        const previousValue = this.grid[loc.y][loc.x];

        // Jump out if it's not even a change.
        if (previousValue === value) return;

        this.grid[loc.y][loc.x] = value;
        this.currentlySafe = false;
    }

    // Find the first location of a true element in the grid, starting in the top-left and scanning across rows first.
    firstTrue(startloc: Location = {x: 0, y: 0}): Location | undefined {
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
                todo.push(...this.neighbourFunction(cur));
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
                todo.push(...this.neighbourFunction(cur));
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

    neighbourCount = (loc: Location) => this.neighbourFunction(loc).filter(n => this.check(n)).length;

    countTruesInColumn = (colNum: number) => {
        let ret = 0;
        for (let i = 0; i < this.size.height; i++) {
            if (this.check({x: colNum, y: i})) ret++;
        }
        return ret;
    }

    countTruesInRow = (rowNum: number) => {
        let ret = 0;
        for (let i = 0; i < this.size.width; i++) {
            if (this.check({y: rowNum, x: i})) ret++;
        }
        return ret;
    }

    trueLocs(value = true): Location[] {
        const ret = [];
        for (let j = 0; j < this.size.height; j++) {
            for (let i = 0; i < this.size.width; i++) {
                if (this.grid[j][i] === value) ret.push({x: i, y: j});
            }
        }
        return ret;
    }

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

    isLeaf = (loc: Location) => (this.check(loc) && this.neighbourCount(loc) === 1);

    inverted(): MutableGrid {
        const ret = new MutableGrid(this.size, false);
        ret.grid = this.grid.map(row => row.map(b => !b));
        ret.lastSafe = this.lastSafe.map(row => row.map(b => !b));
        ret.currentlySafe = this.currentlySafe;
        return ret;
    }

    leafGrid(): MutableGrid {
        const ret = new MutableGrid(this.size, false);
        this.leaves().forEach(l => ret.setLoc(l, true));
        return ret;
    }

    // Make the string generated by a call to stringEncoding regenerate the MutableGrid that generated it.

    // Check whether all of the current values are the same for this and another MutableGrid.
    equals(other: MutableGrid): boolean {
        // Grids have the be the same size to be equal.
        if (!(this.size.height === other.size.height && this.size.width === other.size.width)) return false;
        for (let j = 0; j < this.size.height; j++) {
            for (let i = 0; i < this.size.width; i++) {
                const loc = {x: i, y: j,};
                if (this.check(loc) !== other.check(loc)) return false;
            }
        }
        return true;
    }

    // Get a base64-encoded copy of the grid suitable for shipping around in url strings
    stringEncoding(): string {
        // This is clumsy code but it works.
        const bitstring = this.grid.map(row => row.map(g => g ? 1 : 0)).flat();
        const padLength = (8 - (bitstring.length % 8)) % 8;
        for (let i = 0; i < padLength; i++) bitstring.push(0);
        const bytelength = bitstring.length / 8;
        const bytes = [];
        for (let i = 0; i < bytelength; i++) {
            bytes.push(bitstring[i * 8] * 1 + bitstring[i * 8 + 1] * 2 + bitstring[i * 8 + 2] * 4 +
                bitstring[i * 8 + 3] * 8 + bitstring[i * 8 + 4] * 16 + bitstring[i * 8 + 5] * 32 +
                bitstring[i * 8 + 6] * 64 + bitstring[i * 8 + 7] * 128);
        }
        let result = "";
        bytes.forEach((char) => {
            result += String.fromCharCode(char);
        });

        let encoded = btoa(result);
        // console.log(encoded);
        return encoded;
    }

    public calculateDiameter(): MaxDistance | undefined {
        const init = this.firstTrue();
        if (!init) return undefined;
        let maxDistance = this.maxDistance(init);
        // Borrowed from https://en.wikipedia.org/wiki/Distance_(graph_theory)
        do {
            const newDistance = this.maxDistance(maxDistance.destination);
            // We're done if the number doesn't improve.
            if (newDistance.distance == maxDistance.distance) return newDistance;
            maxDistance = newDistance;
        } while (true)
    }

    private maxDistance(init: Location): MaxDistance {
        let distanceSets = new Array<Array<Location>>();
        const visited = new Set<string>();

        distanceSets.push([init]);
        visited.add(loc2Str(init));
        let progress = true;
        while (progress) {
            progress = false;
            // The neighbours of the previous wave.
            const nextwave = new Set(
                distanceSets[distanceSets.length - 1]
                    .map(loc => this.neighbourFunction(loc).filter(loc => this.check(loc)))
                    .flat()
                    .map(loc2Str));
            const further = new Array<Location>();
            nextwave.forEach(ls => {
                if (visited.has(ls)) return;
                progress = true;
                visited.add(ls);
                further.push(locFromStr(ls)!);
            });
            if (further.length > 0) distanceSets.push(further);
        }
        const maxDistanceLocs = distanceSets[distanceSets.length - 1];
        let minDegree = Number.MAX_VALUE;
        let minDegreeLoc = init;
        maxDistanceLocs.forEach(loc => {
            const neighbourCount = this.neighbourCount(loc);
            if (neighbourCount < minDegree) {
                minDegree = neighbourCount;
                minDegreeLoc = loc;
            }
        });
        const ret = {
            source: init,
            destination: minDegreeLoc,
            distance: distanceSets.length - 1,
        }
        console.log(ret);
        return ret;
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
