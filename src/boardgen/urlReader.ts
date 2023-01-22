import {DDBoardSpec, monsterChoices} from "./ddBoardgen";
import {MutableGrid} from "./mutableGrid";
import {SolnRecord} from "../components/puzzleGame";
import {loc2Str, locFromStr} from "./graphUtils";
import {Location} from "./types";


function buildPuzzleSpec(s: SolnRecord): DDBoardSpec {
    const floors = s.wallGrid.inverted();
    return {
        walls: s.wallGrid,
        wallCounts: s.wallGrid.profile(true),
        rules: {size: s.wallGrid.size, throneSpec: {attemptFirst: 1, attemptSubsequent: 1}},
        deadends: floors.leafGrid(),
        monsterChoices: monsterChoices(floors),
        treasure: MutableGrid.fromLocs(s.wallGrid.size, s.thrones),
        throneCount: s.thrones.length,
        floors: floors,
        restarts: 0,
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
        if (!height || !width || !puzzleString || !thrones) return undefined;

        const t = atob(thrones).split('/').map(locFromStr);
        if (t.some(l => !l)) return undefined;

        const size = {height: +height, width: +width};
        const ret = MutableGrid.fromString(size, puzzleString);
        return buildPuzzleSpec({wallGrid: ret, thrones: t as Location[]});
    }

    static urlFromPuzzle(p: DDBoardSpec): string {
        const wallSequenceString = p.walls.stringEncoding();
        const throneSequenceString = btoa(p.treasure.trueLocs().map(loc2Str).join('/'));

        // const baseURL = 'http://dandd.therestinmotion.com';
        const baseURL = 'http://localhost:3000/';
        const myUrl = new URL(baseURL);
        myUrl.searchParams.set('h', p.rules.size.height.toString());
        myUrl.searchParams.set('w', p.rules.size.width.toString());
        myUrl.searchParams.set('p', wallSequenceString);
        myUrl.searchParams.set('t', throneSequenceString);

        return myUrl.toString();
    }
}

export default UrlReader;