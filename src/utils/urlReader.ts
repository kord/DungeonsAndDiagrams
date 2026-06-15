import { DDBoardSpec, monsterChoices } from "../boardgen/ddBoardgen";
import { MutableGrid } from "./mutableGrid";
import { loc2Str, locFromStr, hashString, gridLocations, createRng } from "../boardgen/graphUtils";
import { Location, Size, SolnRecord } from "./types";


// --- Compact binary format helpers ---

/** Unpack a slice of a byte array into a MutableGrid (LSB-first per byte, matching stringEncoding). */
function gridFromBytes(size: Size, bytes: Uint8Array, offset: number): MutableGrid {
    const grid = new MutableGrid(size, false);
    const locs = gridLocations(size).flat();
    for (let i = 0; i < locs.length; i++) {
        const byteIdx = offset + Math.floor(i / 8);
        if ((bytes[byteIdx] >> (i % 8)) & 1) {
            grid.setLoc(locs[i], true);
        }
    }
    grid.markSafe();
    return grid;
}

/** Encode a byte array as base62 (0-9A-Za-z), preserving leading zeros. */
function toBase62(bytes: Uint8Array): string {
    const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    // Count and strip leading zero bytes; we restore them after encoding.
    let leadingZeros = 0;
    while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros++;

    if (leadingZeros === bytes.length) return '0'.repeat(leadingZeros);

    const num = Array.from(bytes.slice(leadingZeros));
    const digits: number[] = [];
    while (num.some(b => b !== 0)) {
        let remainder = 0;
        for (let i = 0; i < num.length; i++) {
            const n = remainder * 256 + num[i];
            num[i] = Math.floor(n / 62);
            remainder = n % 62;
        }
        digits.push(remainder);
    }

    return '0'.repeat(leadingZeros) + digits.reverse().map(d => ALPHABET[d]).join('');
}

/** Decode a base62 string back into a byte array. */
function fromBase62(str: string): Uint8Array {
    const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charMap = new Map<string, number>();
    for (let i = 0; i < ALPHABET.length; i++) charMap.set(ALPHABET[i], i);

    // Count and strip leading zeros; we restore them after decoding.
    let leadingZeros = 0;
    while (leadingZeros < str.length && str[leadingZeros] === '0') leadingZeros++;

    if (leadingZeros === str.length) return new Uint8Array(leadingZeros);

    const bytes: number[] = [];
    for (const ch of str.slice(leadingZeros)) {
        const val = charMap.get(ch);
        if (val === undefined) throw new Error(`Invalid base62 character: ${ch}`);

        let carry = val;
        for (let i = bytes.length - 1; i >= 0; i--) {
            const n = bytes[i] * 62 + carry;
            bytes[i] = n & 0xFF;
            carry = n >>> 8;
        }
        while (carry > 0) {
            bytes.unshift(carry & 0xFF);
            carry >>>= 8;
        }
    }

    const result = new Uint8Array(leadingZeros + bytes.length);
    result.set(bytes, leadingZeros);
    return result;
}


function buildPuzzleSpec(s: SolnRecord): DDBoardSpec {
    const floors = s.walls.inverted();
    const treasure = MutableGrid.fromLocs(s.walls.size, s.treasures);
    // Preserve the exact current URL rather than regenerating it, so the stored
    // url always matches what's in the browser's address bar.
    const url = window.location.href;

    // Derive the same deterministic seed used at generation time.
    const puzzleSeed = hashString(s.walls.stringEncoding() + '|' +
        s.treasures.map(loc2Str).sort().join(','));

    return {
        walls: s.walls,
        wallCounts: s.walls.profile(true),
        rules: { size: s.walls.size, throneSpec: { attemptFirst: 1, attemptSubsequent: 1 } },
        deadends: floors.leafGrid(),
        monsterChoices: monsterChoices(floors, puzzleSeed),
        treasure: treasure,
        throneCount: s.treasures.length,
        floors: floors,
        url: url,
    };
}


class UrlReader {

    // --- Decoding (supports both legacy and compact formats) ---

    static puzzleFromUrl() {
        const queryParams = new URLSearchParams(window.location.search);

        // Try the new compact format first:  ?z=<base64url>
        const compact = queryParams.get('z');
        if (compact) {
            const decoded = UrlReader.decodeCompact(compact);
            if (decoded) {
                return buildPuzzleSpec({
                    walls: decoded.walls,
                    treasures: decoded.treasure.trueLocs(),
                });
            }
            return undefined;
        }

        // Legacy format:  ?h=<height>&w=<width>&p=<base64>&t=<base64>
        const height = queryParams.get('h');
        const width = queryParams.get('w');
        const puzzleString = queryParams.get('p');
        const thrones = queryParams.get('t');
        if (!height || !width || !puzzleString) return undefined;

        const t = thrones === null ? [] : atob(thrones).split('/').map(locFromStr);
        if (t.some(l => !l)) return undefined;

        const size = { height: +height, width: +width };
        const ret = MutableGrid.fromString(size, puzzleString);
        return buildPuzzleSpec({ walls: ret, treasures: t as Location[] });
    }

    // --- Encoding (only outputs the new compact format) ---

    static urlFromPuzzle(walls: MutableGrid, treasure: MutableGrid): string {
        const size = walls.size;
        if (treasure.size.width !== size.width || treasure.size.height !== size.height)
            throw new Error('walls and treasure have different sizes in urlFromPuzzle.');

        const compact = UrlReader.encodeCompact(walls, treasure);

        const baseURL = window.location.origin + window.location.pathname;
        const myUrl = new URL(baseURL);
        myUrl.searchParams.set('z', compact);
        return myUrl.toString();
    }

    // --- Compact format:  [height:1B][width:1B][wall bits][treasure bits] → XOR → base62 ---

    // Fixed seed so the XOR stream is deterministic across all puzzles.
    private static readonly XOR_SEED = 0x444E44;  // "DND"

    static encodeCompact(walls: MutableGrid, treasure: MutableGrid): string {
        // Reuse the existing bit-packing (LSB-first per byte) via stringEncoding → base64-decode.
        const wallBytes = Uint8Array.from(atob(walls.stringEncoding()), c => c.charCodeAt(0));
        const treasureBytes = Uint8Array.from(atob(treasure.stringEncoding()), c => c.charCodeAt(0));

        const totalLen = 2 + wallBytes.length + treasureBytes.length;
        const packed = new Uint8Array(totalLen);
        packed[0] = walls.size.height;
        packed[1] = walls.size.width;
        packed.set(wallBytes, 2);
        packed.set(treasureBytes, 2 + wallBytes.length);

        // XOR with a deterministic PRNG stream to break up repeated "A" runs.
        const rng = createRng(UrlReader.XOR_SEED);
        for (let i = 0; i < packed.length; i++) {
            packed[i] ^= (rng() * 256) | 0;
        }

        return toBase62(packed);
    }

    static decodeCompact(encoded: string): { walls: MutableGrid; treasure: MutableGrid } | undefined {
        try {
            const bytes = fromBase62(encoded);

            // Reverse the XOR obfuscation.
            const rng = createRng(UrlReader.XOR_SEED);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] ^= (rng() * 256) | 0;
            }

            const height = bytes[0];
            const width = bytes[1];
            if (!height || !width || height > 100 || width > 100) return undefined;
            const size = { height, width };
            const gridByteLen = Math.ceil((height * width) / 8);

            const walls = gridFromBytes(size, bytes, 2);
            const treasure = gridFromBytes(size, bytes, 2 + gridByteLen);

            return { walls, treasure };
        } catch {
            return undefined;
        }
    }
}

export default UrlReader;