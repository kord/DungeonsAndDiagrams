import {Location, Size} from "./types";
import {gridLocations, loc2Str, shuffle} from "./graphUtils";
import {MutableGrid} from "./mutableGrid";

export type DDSpec = {
    size: Size,
    throneCount?: number,
    no2x2?: boolean,
    singleComponent?: boolean,
}

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

            core = {x: loc!.x + 1, y: loc!.y + 1};
            const room = gridLocations(throneSize, loc!).flat();
            const roomstrs = new Set(room.map(loc2Str));
            const roomneighbours = room.map(loc => grid.nf(loc)).flat().filter(loc => !roomstrs.has(loc2Str(loc)));
            const exit = roomneighbours.splice(randomInt(roomneighbours.length), 1);
            roomneighbours.forEach(loc => grid.setLoc(loc, false));
            grid.setLoc(core, false);

            if (grid.componentCount() == 1) {
                foundone = true;
                grid.declareSafe();
            } else grid.revert()
        }
    }
    if (foundone)
        return core!;
}

export function ddGen(spec: DDSpec) {
    const disallowedBlockSize = {height: 2, width: 2};
    const randomInt = (n: number) => Math.floor(Math.random() * n);
    const grid = new MutableGrid(spec.size);

    let foundone = true;
    let loopcount = 0;

    let throneloc = installThrone(grid);
    console.log(throneloc);
    let throneloc2 = installThrone(grid);
    console.log(throneloc2);
    let throneloc3 = installThrone(grid);
    console.log(throneloc3);

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
                grid.declareSafe();
                grid.setLoc({x: loc.x + randomInt(2), y: loc.y + randomInt(2)}, false);
                if (grid.componentCount() != 1) grid.revert();
            }
        });
    }

    if (throneloc)
        grid.setLoc(throneloc, true)
    if (throneloc2)
        grid.setLoc(throneloc2, true)
    if (throneloc3)
        grid.setLoc(throneloc3, true)

    // if (foundone)
    grid.show();


}