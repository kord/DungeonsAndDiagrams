import { Location, Size } from "../utils/types";

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
    return { x: l[0], y: l[1] };
}

// Just get a big fat dump of each of the locations in a grid of a certain size, possibly with some specified
// top-left corner element.
export function gridLocations(size: Size, rootLoc: Location = { x: 0, y: 0 }): Location[][] {
    let ret = [];
    for (let j = rootLoc.y; j < rootLoc.y + size.height; j++) {
        const row = [];
        for (let i = rootLoc.x; i < rootLoc.x + size.width; i++) {
            row.push({ x: i, y: j });
        }
        ret.push(row);
    }
    return ret;
}

export let gridNeighbourFunc = (size: Size) => {
    return (loc: Location) => {
        let candidates =
            [
                { x: loc.x, y: loc.y + 1 },
                { x: loc.x, y: loc.y - 1 },
                { x: loc.x + 1, y: loc.y },
                { x: loc.x - 1, y: loc.y }
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

// --- Seeded PRNG (mulberry32) ---
// Returns a function that produces deterministic floats in [0,1) from a 32-bit seed.
export function createRng(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// djb2 string hash → unsigned 32-bit integer.
export function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}
