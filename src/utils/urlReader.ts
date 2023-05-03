import {DDBoardSpec, monsterChoices} from "../boardgen/ddBoardgen";
import {MutableGrid} from "./mutableGrid";
import {loc2Str, locFromStr} from "../boardgen/graphUtils";
import {Location, SolnRecord} from "./types";


function buildPuzzleSpec(s: SolnRecord): DDBoardSpec {
    const floors = s.walls.inverted();
    const treasure = MutableGrid.fromLocs(s.walls.size, s.treasures);
    const url = UrlReader.urlFromPuzzle(s.walls, treasure)
    return {
        walls: s.walls,
        wallCounts: s.walls.profile(true),
        rules: {size: s.walls.size, throneSpec: {attemptFirst: 1, attemptSubsequent: 1}},
        deadends: floors.leafGrid(),
        monsterChoices: monsterChoices(floors),
        treasure: treasure,
        throneCount: s.treasures.length,
        floors: floors,
        url: url,
    };
}


class UrlReader {
    constructor() {
    }

    static puzzleFromUrl() {
        const queryParams = new URLSearchParams(window.location.search);
        const height = queryParams.get('h');
        const width = queryParams.get('w');
        const puzzleString = queryParams.get('p');
        const thrones = queryParams.get('t');
        if (!height || !width || !puzzleString) return undefined;

        const t = thrones === null ? [] : atob(thrones).split('/').map(locFromStr);
        if (t.some(l => !l)) return undefined;

        const size = {height: +height, width: +width};
        const ret = MutableGrid.fromString(size, puzzleString);
        return buildPuzzleSpec({walls: ret, treasures: t as Location[]});
    }

    // static urlFromBoardSpec(p: DDBoardSpec): string {
    //     const wallSequenceString = p.walls.stringEncoding();
    //     const throneSequenceString = btoa(p.treasure.trueLocs().map(loc2Str).join('/'));
    //
    //     const baseURL = window.location.href;
    //     // console.log(baseURL);
    //     const myUrl = new URL(baseURL);
    //     myUrl.searchParams.set('h', p.rules.size.height.toString());
    //     myUrl.searchParams.set('w', p.rules.size.width.toString());
    //     myUrl.searchParams.set('p', wallSequenceString);
    //     if (throneSequenceString.length > 0) myUrl.searchParams.set('t', throneSequenceString);
    //
    //     return myUrl.toString();
    // }

    static urlFromPuzzle(walls: MutableGrid, treasure: MutableGrid): string {
        const size = walls.size;
        if (treasure.size.width !== size.width || treasure.size.height !== size.height)
            throw new Error('walls and treasure have different sizes in urlFromPuzzle.')
        const wallSequenceString = walls.stringEncoding();
        const throneSequenceString = btoa(treasure.trueLocs().map(loc2Str).join('/'));

        const baseURL = window.location.href;
        // console.log(baseURL);
        const myUrl = new URL(baseURL);
        myUrl.searchParams.set('h', size.height.toString());
        myUrl.searchParams.set('w', size.width.toString());
        myUrl.searchParams.set('p', wallSequenceString);
        if (throneSequenceString.length > 0) myUrl.searchParams.set('t', throneSequenceString);

        return myUrl.toString();
    }
}

export default UrlReader;