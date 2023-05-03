import {Size} from "./types";
import {DDBoardSpec} from "../boardgen/ddBoardgen";

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

export function markAsSolved(puzzle: DDBoardSpec) {
    const url = puzzle.url;
    const key = `dnd_solved_${url}`
    localStorage.setItem(key, solvedValueMarker);
}

export function hasBeenSolved(puzzle: DDBoardSpec) {
    const url = puzzle.url;
    const key = `dnd_solved_${url}`
    const val = localStorage.getItem(key);
    return val === solvedValueMarker;
}