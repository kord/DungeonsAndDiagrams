import {Linestats, Location, Size} from "./types";
import {gridLocations, loc2Str, shuffle} from "./graphUtils";
import {MutableGrid} from "./mutableGrid";
import {hasMultipleSolutions} from "./ddSolver";

type ThroneDemand = {
    attemptFirst: number,
    attemptSubsequent: number,
}

export type DDBoardgenSpec = {
    size: Size,
    throneSpec: ThroneDemand,
}

export type DDBoardSpec = {
    // The rules that were used to generate this board.
    rules: DDBoardgenSpec,
    floors: MutableGrid,
    walls: MutableGrid,

    throneCount: number,
    treasure: MutableGrid,
    deadends: MutableGrid,
    monsterChoices: Map<string, number>,

    wallCounts: Linestats,

    restarts: number,
}

// Try to place a throne in a sensible manner.
// The passed grid is changed to include the 3x3 blank, and the center of that room is returned if space could be
// found for such a room.
function installThrone(grid: MutableGrid) {
    // console.log(`Entered installThrone`)
    const throneSize: Size = {width: 3, height: 3};
    const randomInt = (n: number) => Math.floor(Math.random() * n);

    let foundone = false;
    let loopcount = 0;
    let loc, core: Location;
    while (!foundone && loopcount < 1000) {
        foundone = false;
        loopcount++;

        // TODO: Instead of trying random locations forever, maybe try a random-order list of possible locations.
        //  But then again, who gives a fuck if this is slow? Premature optimization?
        loc = {
            y: randomInt(grid.size.height - throneSize.height + 1),
            x: randomInt(grid.size.width - throneSize.width + 1)
        };

        if (grid.checkBlock(loc, throneSize)) {
            // We have a candidate location...
            core = {x: loc!.x + 1, y: loc!.y + 1};
            const room = gridLocations(throneSize, loc!).flat();
            const roomstrs = new Set(room.map(loc2Str));
            const roomneighbours = room.map(loc => grid.neighbourFunction(loc)).flat().filter(loc => !roomstrs.has(loc2Str(loc)));
            // The exit is the only one we don't explicitly set to false.
            const exit = roomneighbours.splice(randomInt(roomneighbours.length), 1)[0];
            roomneighbours.forEach(loc => grid.setLoc(loc, false));

            const components = grid.connectedComponents();
            // There are a couple cases we can handle.
            // If the remainder forms a single connected component, we're golden.
            // If we're left with singleton components, we can do that too, by falsing out the singletons.
            if (components.length === 1) {
                foundone = true;
                grid.markSafe();
                // grid.show()
            } else if (components.filter(c => c.length > 1).length === 1) {
                foundone = true;
                const singletons = components.filter(c => c.length === 1);
                for (let singleton of singletons) {
                    grid.setLoc(singleton[0], false);
                }
                grid.markSafe();
            } else {
                // console.log(`grid.componentSizes() ${grid.componentSizes()}`)
                grid.revert()
            }
        }
    }

    if (foundone) {
        // grid.show()
        return core!;
    }
}

export function ddGen(spec: DDBoardgenSpec) {
    const disallowedBlockSize = {height: 2, width: 2};
    const randomInt = (n: number) => Math.floor(Math.random() * n);

    let grid: MutableGrid;
    let throneLocs = [];
    let loopCount = 0;
    let twox2Done: boolean = false;
    do {
        loopCount++;
        grid = new MutableGrid(spec.size, true);

        // Install thrones
        const {throneSpec} = spec;

        throneLocs = [];
        const installFirst = Math.random() <= throneSpec.attemptFirst;
        if (installFirst) {
            do {
                loopCount++;
                let throneloc = installThrone(grid);
                // False out the center so our subsequent processing won't find a blank 2x2 in there.
                if (throneloc !== undefined) {
                    throneLocs.push(throneloc);
                    grid.setLoc(throneloc, false);
                    grid.markSafe();
                }
            } while (Math.random() <= throneSpec.attemptSubsequent);
        }

        // Eliminate 2x2s

        // All of the possible spots on the grid where we need to be vigilant about a 2x2 opening.
        let blockPossibilities = shuffle(gridLocations({
            height: spec.size.height - 1,
            width: spec.size.width - 1
        }).flat());

        twox2Done = blockPossibilities.every(loc => {
            let success = true;
            if (grid.checkBlock(loc, disallowedBlockSize)) {
                const candidates = shuffle(gridLocations({width: 2, height: 2}, loc).flat());
                success = candidates.some(cl => {
                    grid.markSafe();
                    grid.setLoc(cl, false);
                    if (grid.componentCount() !== 1) grid.revert();
                    else return true;
                    return false;
                });
            }
            return success;
        });
    } while (!twox2Done);

    // Revert our falsed out room centers.
    throneLocs.forEach(loc => grid.setLoc(loc, true));
    grid.markSafe();

    return {grid: grid, throneLocs: throneLocs, restarts: loopCount};
}

// Wiggle a point into one of its 9 neighbours uniformly at random.
function offCenter(loc: Location): Location {
    return {
        x: loc.x + Math.floor(Math.random() * 3) - 1,
        y: loc.y + Math.floor(Math.random() * 3) - 1,
    }
}

const maxMonster = 5;

export function monsterChoices(g: MutableGrid) {
    const monsterChoice = new Map<string, number>();
    g.leaves().forEach(loc => monsterChoice.set(loc2Str(loc), 1 + Math.floor(Math.random() * maxMonster)));

    // console.log(monsterChoice)
    return monsterChoice;
}

export function generateDDBoard(spec: DDBoardgenSpec): DDBoardSpec {
    console.time('generateDDBoard');
    let ret: DDBoardSpec;
    let restarts = 0;
    do {
        let board = ddGen(spec);

        const {grid, throneLocs} = board;
        // grid.show();

        const walls = new MutableGrid(spec.size, true);
        grid.trueLocs().forEach(loc => walls.setLoc(loc, false));
        walls.markSafe();

        const deadends = new MutableGrid(spec.size, false);
        grid.leaves().forEach(loc => deadends.setLoc(loc, true));
        deadends.markSafe();

        const throneCenters = new MutableGrid(spec.size, false);
        throneLocs.forEach(loc => throneCenters.setLoc(loc, true));
        throneCenters.markSafe();

        const treasure = new MutableGrid(spec.size, false);
        throneLocs.forEach(loc => treasure.setLoc(offCenter(loc), true));
        treasure.markSafe();

        const wallCounts = grid.profile(false);

        ret = {
            rules: spec,
            floors: grid,
            walls: walls,
            deadends: deadends,
            monsterChoices: monsterChoices(grid),
            treasure: treasure,
            throneCount: throneLocs.length,
            wallCounts: wallCounts,

            restarts: restarts,
        }

        restarts += board.restarts;
    } while (hasMultipleSolutions(ret));
    console.timeEnd('generateDDBoard');
    // console.log(`restarts: ${restarts}`)

    return ret;
}