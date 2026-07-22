import { Size } from "./types";
import { DDBoardSpec } from "../boardgen/ddBoardgen";
import UrlReader from "./urlReader";

const solvedEntryPrefix = 'dnd_solved_';

type Defaults = {
    height: string,
    width: string,
    showPuzzleInfo: string,
    lockWhenSolved: string,
    colorfulLineCounters: string,
}

const defaultValues: Defaults = {
    height: '8',
    width: '8',
    showPuzzleInfo: 'false',
    lockWhenSolved: 'true',
    colorfulLineCounters: 'true',
}

type PuzzleSolutionRecord = {
    url: string,
    isSolved: boolean,
    generatedTime?: number,
    solvedTime?: number,
    size: Size,
}

export type { PuzzleSolutionRecord };

export function getStoredValue(valueName: string): string | undefined {
    const key = `dnd_${valueName}`;
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) return storedValue;
    return defaultValues[valueName as keyof Defaults] || undefined;
}

export function getStorednumber(valueName: string): number | undefined {
    const v = getStoredValue(valueName);
    if (!v) return undefined;
    const num = +v;
    return num;
}

export function getStoredBool(valueName: string): boolean {
    const v = getStoredValue(valueName);
    if (v === 'true') return true;
    if (v === 'false') return false;
    // Default to false if we're trying to look up something absurd.
    return false;
}

export function getStoredSize() {
    return {
        height: getStorednumber('height'),
        width: getStorednumber('width'),
    } as Size;
}

export function setStoredValue(valueName: string, value: string) {
    const key = `dnd_${valueName}`;
    localStorage.setItem(key, value);
}

export function setStoredNumber(valueName: string, value: number) {
    const key = `dnd_${valueName}`;
    localStorage.setItem(key, value.toString());
}

export function setStoredBool(valueName: string, value: boolean) {
    const key = `dnd_${valueName}`;
    localStorage.setItem(key, value.toString());
}

const solvedValueMarker = 'solved';
const unsolvedValueMarker = 'unsolved';

/** Parse an existing solved-status entry.  Handles all formats:
 *   "solved"                             – legacy, no timestamps
 *   "unsolved"                           – legacy, no timestamps
 *   "unsolved|<gen>"                     – generated but not yet solved
 *   "solved|<gen>"                       – solved, gen time known
 *   "solved|<gen>|<solve>"              – solved, both timestamps known
 */
function parseSolvedEntry(val: string | null): { generatedTime?: number; solvedTime?: number } {
    if (!val) return {};
    const match = /^(solved|unsolved)(?:\|(\d*))?(?:\|(\d*))?$/.exec(val);
    if (!match) return {};
    return {
        generatedTime: match[2] !== '' && match[2] !== undefined ? +match[2] : undefined,
        solvedTime: match[3] !== '' && match[3] !== undefined ? +match[3] : undefined,
    };
}

export function markAsSolved(puzzle: DDBoardSpec, solved_time?: number) {
    const url = puzzle.url;
    const key = `${solvedEntryPrefix}${url}`;
    const { generatedTime, solvedTime: prevSolvedTime } = parseSolvedEntry(localStorage.getItem(key));
    const value = `${solvedValueMarker}|${generatedTime ?? ''}|${solved_time ?? prevSolvedTime ?? ''}`;
    localStorage.setItem(key, value);
    console.log(`Puzzle at ${url} marked as solved.  Entry: ${value}`);
}

export function markAsUnsolved(puzzle: DDBoardSpec, generated_time?: number) {
    const url = puzzle.url;
    const key = `${solvedEntryPrefix}${url}`;
    const value = `${unsolvedValueMarker}|${generated_time ?? ''}`;
    localStorage.setItem(key, value);
    console.log(`Puzzle at ${url} marked as unsolved.  Entry: ${value}`);
}

export function hasBeenSolved(puzzle: DDBoardSpec) {
    const url = puzzle.url;
    const key = `${solvedEntryPrefix}${url}`;
    const val = localStorage.getItem(key);
    return val !== null && val.startsWith(solvedValueMarker);
}

/** Extract puzzle size from a URL (compact ?z=<base62> or legacy ?h=X&w=Y). */
function sizeFromUrl(url: string): Size {
    try {
        const params = new URLSearchParams(new URL(url).search);
        // Compact format: ?z=<base62>
        const z = params.get('z');
        if (z) {
            const size = UrlReader.decodeSize(z);
            if (size) return size;
        }
        // Legacy format: ?h=X&w=Y
        const h = params.get('h');
        const w = params.get('w');
        if (h && w) return { height: +h, width: +w };
    } catch { /* malformed URL — return zero size */ }
    return { height: 0, width: 0 };
}

/** Return all known puzzle solution records from localStorage. */
export function getAllPuzzleRecords(): PuzzleSolutionRecord[] {
    const records: PuzzleSolutionRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(solvedEntryPrefix)) continue;
        const val = localStorage.getItem(key);
        const url = key.slice(solvedEntryPrefix.length);
        const { generatedTime, solvedTime } = parseSolvedEntry(val);
        const isSolved = val !== null && val.startsWith(solvedValueMarker);
        records.push({
            url,
            isSolved,
            generatedTime,
            solvedTime,
            size: sizeFromUrl(url),
        });
    }
    return records;
}

/** Determine dark mode preference: stored value first, then system default. */
export function getDarkModePreference(): boolean {
    const stored = getStoredValue('darkMode');
    if (stored !== undefined) {
        return stored === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Apply the current darkMode setting from localStorage to the DOM. */
export function applyTheme() {
    const dark = getDarkModePreference();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

