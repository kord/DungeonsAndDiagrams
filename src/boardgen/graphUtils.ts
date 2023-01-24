import {Location, Size} from "./types";

export function loc2Str(loc: Location) {
    return `${loc.x},${loc.y}`;
}

export function locFromStr(str: string | undefined): Location | undefined {
    if (!str) return undefined;
    let l = str.split(",").map(Number)
    if (l.length !== 2) {
        console.error(`Can't parse Location from "${str}"`);
        return undefined;
    }
    return {x: l[0], y: l[1]};
}

// Just get a big fat dump of each of the locations in a grid of a certain size, possibly with some specified
// top-left corner element.
export function gridLocations(size: Size, rootLoc: Location = {x: 0, y: 0}): Location[][] {
    let ret = [];
    for (let j = rootLoc.y; j < rootLoc.y + size.height; j++) {
        const row = [];
        for (let i = rootLoc.x; i < rootLoc.x + size.width; i++) {
            row.push({x: i, y: j});
        }
        ret.push(row);
    }
    return ret;
}

export let gridNeighbourFunc = (size: Size) => {
    return (loc: Location) => {
        let candidates =
            [
                {x: loc.x, y: loc.y + 1},
                {x: loc.x, y: loc.y - 1},
                {x: loc.x + 1, y: loc.y},
                {x: loc.x - 1, y: loc.y}
            ];
        return candidates.filter(
            (loc: Location) => loc.x >= 0 && loc.y >= 0 && loc.x < size.width && loc.y < size.height);
    }
}

export function shuffle(array: Array<any>) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
