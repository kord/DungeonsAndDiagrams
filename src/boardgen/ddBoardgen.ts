import {Location, Size} from "./types";
import {gridLocations, loc2Str, shuffle} from "./graphUtils";
import {MutableGrid} from "./mutableGrid";

type ThroneDemand = {
    attemptFirst: number,
    attemptSubsequent: number,
}

export type DDSpec = {
    size: Size,
    throneSpec: ThroneDemand,
    no2x2?: boolean,
    singleComponent?: boolean,
}

// Try to place a throne in a sensible manner.
// The passed grid is changed to include the 3x3 blank, and the center of that room is returned if space could be
// found for such a room.
function installThrone(grid: MutableGrid) {
    const throneSize: Size = {width: 3, height: 3};
    const randomInt = (n: number) => Math.floor(Math.random() * n);

    let foundone = false;
    let loopcount = 0;
    let loc, core: Location;
    while (!foundone && loopcount < 1000) {
        foundone = false;
        loopcount++;

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
            const exit = roomneighbours.splice(randomInt(roomneighbours.length), 1);
            roomneighbours.forEach(loc => grid.setLoc(loc, false));

            const components = grid.connectedComponents();
            // There are a couple cases we can handle.
            // If the remainder forms a single connected component, we're golden.
            // If we're left with singleton components, we can do that too, by falsing out the singletons.
            if (components.length == 1) {
                foundone = true;
                grid.markSafe();
            } else if (components.filter(c => c.length > 1).length == 1) {
                foundone = true;
                const singletons = components.filter(c => c.length == 1);
                for (let singleton of singletons) {
                    grid.setLoc(singleton[0], false);
                }
                grid.markSafe();
            } else {
                console.log(`grid.componentSizes() ${grid.componentSizes()}`)
                grid.revert()
            }
        }
    }
    if (foundone) return core!;
}

export function ddGen(spec: DDSpec) {
    const disallowedBlockSize = {height: 2, width: 2};
    const randomInt = (n: number) => Math.floor(Math.random() * n);
    const grid = new MutableGrid(spec.size);

    let foundone = true;
    let loopcount = 0;

    const {throneSpec} = spec;

    const throneLocs = [];
    const installFirst = Math.random() <= throneSpec.attemptFirst;
    if (installFirst) {
        do {
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

    while (foundone && loopcount < 100) {
        foundone = false;
        loopcount++;

        blockPossibilities.forEach(loc => {
            if (grid.checkBlock(loc, disallowedBlockSize)) {
                foundone = true;
                grid.markSafe();
                grid.setLoc({x: loc.x + randomInt(2), y: loc.y + randomInt(2)}, false);
                if (grid.componentCount() != 1) grid.revert();
            }
        });
    }

    // Revert our falsed out room centers.
    console.log(...throneLocs)
    while (throneLocs.length > 0) {
        grid.setLoc(throneLocs.pop()!, true);
    }
    grid.markSafe();

    grid.show();
}