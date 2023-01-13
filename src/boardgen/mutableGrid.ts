import {Location, Size} from "./types";
import {gridLocations, gridNeighbourFunc} from "./graphUtils";

export class MutableGrid {
    currentlySafe: boolean;
    nf: (loc: Location) => Location[];
    private grid: boolean[][];
    private lastSafe: boolean[][];

    constructor(public size: Size) {
        this.grid = constantGrid(size);
        this.lastSafe = constantGrid(size);
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

    declareSafe() {
        this.lastSafe = this.grid.map(row => row.map(b => b));
        this.currentlySafe = true;
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

    componentCount(): number {
        const backup = this.grid.map(row => row.map(b => b));
        let foundComponents = 0;

        while (true) {
            const seed = this.firstTrue();
            if (seed === undefined) break;
            foundComponents += 1;

            const todo = [seed];
            while (todo.length > 0) {
                const cur = todo.pop()!;
                if (!this.check(cur!)) continue;
                this.setLoc(cur, false);
                todo.push(...this.nf(cur));
            }
        }

        // Restore before we started messing with it.
        this.grid = backup;
        return foundComponents;
    }

    checkBlock(loc: Location, size: Size) {
        if (loc.x + size.width > this.size.width) return false;
        if (loc.y + size.height > this.size.height) return false;
        for (let j = 0; j < size.height; j++)
            for (let i = 0; i < size.width; i++) {
                if (!this.check({x: loc.x + i, y: loc.y + j})) return false;
            }
        return true;
    }

    neighbourCount = (loc: Location) => this.nf(loc).filter(n => this.check(n)).length;
    isLeaf = (loc: Location) => (this.check(loc) && this.neighbourCount(loc) == 1);
    leaves = () => gridLocations(this.size).flat().filter(this.isLeaf);

    show() {
        const ret = [];
        for (let j = 0; j < this.size.height; j++) {
            const row = [];
            for (let i = 0; i < this.size.width; i++) {
                const loc = {x: i, y: j};
                if (!this.check(loc)) row.push('x');
                else {
                    row.push(this.isLeaf(loc) ? 'o' : '.');
                }
            }
            ret.push(row.join(''));
        }
        console.log(ret.join('\n'));
        console.log(this.leaves().length)

        // console.log(this.grid.map(row => row.map(v => v ? '.' : 'x').join('')).join('\n'));
    }
}


function constantGrid(size: Size, value = true): boolean[][] {
    const ret = [];
    for (let j = 0; j < size.height; j++) {
        const row = [];
        for (let i = 0; i < size.width; i++) {
            row.push(value);
        }
        ret.push(row);
    }
    return ret;
}
