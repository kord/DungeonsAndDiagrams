import {Linestats, Location, Size} from "./types";
import {gridLocations, loc2Str, shuffle} from "./graphUtils";
import {MutableGrid} from "./mutableGrid";

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
    grid: MutableGrid,

    throneCount: number,
    throneCenters: MutableGrid,
    treasure: MutableGrid,
    deadends: MutableGrid,

    wallCounts: Linestats,

    restarts: number,
}

// Try to place a throne in a sensible manner.
// The passed grid is changed to include the 3x3 blank, and the center of that room is returned if space could be
// found for such a room.
function installThrone(grid: MutableGrid) {
    console.log(`Entered installThrone`)
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
            const roomneighbours = room.map(loc => grid.nf(loc)).flat().filter(loc => !roomstrs.has(loc2Str(loc)));
            // The exit is the only one we don't explicitly set to false.
            const exit = roomneighbours.splice(randomInt(roomneighbours.length), 1)[0];
            roomneighbours.forEach(loc => grid.setLoc(loc, false));

            const components = grid.connectedComponents();
            // There are a couple cases we can handle.
            // If the remainder forms a single connected component, we're golden.
            // If we're left with singleton components, we can do that too, by falsing out the singletons.
            if (components.length == 1) {
                foundone = true;
                grid.markSafe();
                // grid.show()
            } else if (components.filter(c => c.length > 1).length == 1) {
                foundone = true;
                const singletons = components.filter(c => c.length == 1);
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
        grid.show()
        return core!;
    }
}

export function ddGen(spec: DDBoardgenSpec) {
    const disallowedBlockSize = {height: 2, width: 2};
    const randomInt = (n: number) => Math.floor(Math.random() * n);

    const grid = new MutableGrid(spec.size, true);

    let foundone = true;
    let loopcount = 0;

    const {throneSpec} = spec;

    const throneLocs = [];
    const installFirst = Math.random() <= throneSpec.attemptFirst;
    if (installFirst) {
        do {
            loopcount++;
            let throneloc = installThrone(grid);
            // False out the center so our subsequent processing won't find a blank 2x2 in there.
            if (throneloc != undefined) {
                throneLocs.push(throneloc);
                grid.setLoc(throneloc, false);
                grid.markSafe();
            }
        } while (Math.random() <= throneSpec.attemptSubsequent);
    }

    // All of the possible spots on the grid where we need to be vigilant about a 2x2 opening.
    let blockPossibilities = shuffle(gridLocations({
        height: spec.size.height - 1,
        width: spec.size.width - 1
    }).flat());

    let loopcount2 = 0;
    while (foundone && loopcount2 < 100) {
        foundone = false;
        loopcount2++;

        blockPossibilities.forEach(loc => {
            if (grid.checkBlock(loc, disallowedBlockSize)) {
                foundone = true;
                grid.markSafe();
                grid.setLoc({x: loc.x + randomInt(2), y: loc.y + randomInt(2)}, false);
                if (grid.componentCount() != 1) grid.revert();
                // else grid.show()
            }
        });
    }

    // Revert our falsed out room centers.
    console.log(...throneLocs)
    throneLocs.forEach(loc => grid.setLoc(loc, true));
    grid.markSafe();

    return {grid: grid, throneLocs: throneLocs, restarts: loopcount + loopcount2};
}

// Wiggle a point into one of its 9 neighbours uniformly at random.
function offCenter(loc: Location): Location {
    return {
        x: loc.x + Math.floor(Math.random() * 3) - 1,
        y: loc.y + Math.floor(Math.random() * 3) - 1,
    }
}

export function generateDDBoard(spec: DDBoardgenSpec): DDBoardSpec {
    const {grid, throneLocs, restarts} = ddGen(spec);
    // grid.show();

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

    return {
        rules: spec,
        grid: grid,
        deadends: deadends,
        throneCenters: throneCenters,
        treasure: treasure,
        throneCount: throneLocs.length,
        wallCounts: wallCounts,

        restarts: restarts,
    }
}