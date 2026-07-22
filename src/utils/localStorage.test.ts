/**
 * Tests for puzzle solved-status tracking in localStorage.
 *
 * Exercises parseSolvedEntry indirectly through markAsSolved /
 * markAsUnsolved / hasBeenSolved / getAllPuzzleRecords,
 * covering all entry formats.
 */

import {
    markAsSolved,
    markAsUnsolved,
    hasBeenSolved,
    getAllPuzzleRecords,
} from './localStorage';
import { DDBoardSpec } from '../boardgen/ddBoardgen';

/** Minimal DDBoardSpec stub — only the url field matters for these tests. */
function stubSpec(url: string): DDBoardSpec {
    return { url } as DDBoardSpec;
}

describe('puzzle solved-status tracking', () => {
    const url = 'https://example.com/?h=10&w=15&p=abc&t=xyz';
    const key = `dnd_solved_${url}`;
    const spec = stubSpec(url);

    beforeEach(() => {
        localStorage.clear();
    });

    // ── Fresh puzzle ──────────────────────────────────────────

    test('new puzzle is not solved', () => {
        expect(hasBeenSolved(spec)).toBe(false);
    });

    // ── markAsUnsolved ────────────────────────────────────────

    test('markAsUnsolved without time', () => {
        markAsUnsolved(spec);
        expect(localStorage.getItem(key)).toBe('unsolved|');
        expect(hasBeenSolved(spec)).toBe(false);
    });

    test('markAsUnsolved with generated time', () => {
        markAsUnsolved(spec, 1000);
        expect(localStorage.getItem(key)).toBe('unsolved|1000');
        expect(hasBeenSolved(spec)).toBe(false);
    });

    // ── markAsSolved ──────────────────────────────────────────

    test('markAsSolved without time', () => {
        markAsSolved(spec);
        expect(localStorage.getItem(key)).toBe('solved||');
        expect(hasBeenSolved(spec)).toBe(true);
    });

    test('markAsSolved with solved time', () => {
        markAsSolved(spec, 5000);
        expect(localStorage.getItem(key)).toBe('solved||5000');
        expect(hasBeenSolved(spec)).toBe(true);
    });

    // ── Normal flow: generate → solve ─────────────────────────

    test('full flow: markAsUnsolved then markAsSolved with timestamps', () => {
        markAsUnsolved(spec, 1000);
        markAsSolved(spec, 5000);
        expect(localStorage.getItem(key)).toBe('solved|1000|5000');
        expect(hasBeenSolved(spec)).toBe(true);
    });

    test('full flow: markAsUnsolved without time, then markAsSolved with time', () => {
        markAsUnsolved(spec);
        markAsSolved(spec, 5000);
        expect(localStorage.getItem(key)).toBe('solved||5000');
    });

    test('full flow: markAsUnsolved with time, then markAsSolved without time', () => {
        markAsUnsolved(spec, 1000);
        markAsSolved(spec);
        expect(localStorage.getItem(key)).toBe('solved|1000|');
    });

    // ── Re-solve (already solved) ─────────────────────────────

    test('re-solving preserves generated time and updates solved time', () => {
        markAsUnsolved(spec, 1000);
        markAsSolved(spec, 2000);
        markAsSolved(spec, 3000);
        expect(localStorage.getItem(key)).toBe('solved|1000|3000');
    });

    test('re-solving without new solved time keeps previous', () => {
        markAsUnsolved(spec, 1000);
        markAsSolved(spec, 2000);
        markAsSolved(spec); // no new time
        expect(localStorage.getItem(key)).toBe('solved|1000|2000');
    });

    // ── Legacy format compatibility ───────────────────────────

    test('markAsSolved after legacy "solved" entry', () => {
        localStorage.setItem(key, 'solved');
        markAsSolved(spec, 5000);
        expect(localStorage.getItem(key)).toBe('solved||5000');
        expect(hasBeenSolved(spec)).toBe(true);
    });

    test('markAsSolved after legacy "unsolved" entry', () => {
        localStorage.setItem(key, 'unsolved');
        markAsSolved(spec, 5000);
        expect(localStorage.getItem(key)).toBe('solved||5000');
    });

    test('hasBeenSolved with legacy "solved" entry', () => {
        localStorage.setItem(key, 'solved');
        expect(hasBeenSolved(spec)).toBe(true);
    });

    test('hasBeenSolved with legacy "unsolved" entry', () => {
        localStorage.setItem(key, 'unsolved');
        expect(hasBeenSolved(spec)).toBe(false);
    });

    // ── Independence ──────────────────────────────────────────

    test('different puzzles are independent', () => {
        const specA = stubSpec('https://example.com/?h=5&w=5&z=aaa');
        const specB = stubSpec('https://example.com/?h=5&w=5&z=bbb');

        markAsUnsolved(specA, 100);
        markAsSolved(specB, 200);

        expect(hasBeenSolved(specA)).toBe(false);
        expect(hasBeenSolved(specB)).toBe(true);
    });

    // ── markAsUnsolved → markAsUnsolved (regeneration) ────────

    test('markAsUnsolved overwrites previous markAsUnsolved', () => {
        markAsUnsolved(spec, 1000);
        markAsUnsolved(spec, 2000);
        expect(localStorage.getItem(key)).toBe('unsolved|2000');
    });

    test('markAsUnsolved after markAsSolved overwrites solved state', () => {
        markAsSolved(spec, 5000);
        markAsUnsolved(spec, 1000);
        expect(localStorage.getItem(key)).toBe('unsolved|1000');
        expect(hasBeenSolved(spec)).toBe(false);
    });

    // ── getAllPuzzleRecords ───────────────────────────────────

    test('getAllPuzzleRecords: empty when no puzzles stored', () => {
        expect(getAllPuzzleRecords()).toEqual([]);
    });

    test('getAllPuzzleRecords: returns correct records for solved and unsolved', () => {
        const urlA = 'https://example.com/?h=8&w=8&z=a';
        const urlB = 'https://example.com/?h=12&w=10&z=b';
        const specA = stubSpec(urlA);
        const specB = stubSpec(urlB);

        markAsUnsolved(specA, 100);
        markAsSolved(specB, 500);

        const records = getAllPuzzleRecords();

        expect(records).toHaveLength(2);

        const recA = records.find(r => r.url === urlA)!;
        expect(recA.isSolved).toBe(false);
        expect(recA.generatedTime).toBe(100);
        expect(recA.solvedTime).toBeUndefined();
        expect(recA.size).toEqual({ height: 8, width: 8 });

        const recB = records.find(r => r.url === urlB)!;
        expect(recB.isSolved).toBe(true);
        expect(recB.generatedTime).toBeUndefined();
        expect(recB.solvedTime).toBe(500);
        expect(recB.size).toEqual({ height: 12, width: 10 });
    });

    test('getAllPuzzleRecords: size from compact ?z= format (12×20 puzzle)', () => {
        const compactUrl = 'https://example.com/?z=33ZdCZ3zvi5JuBcRjNnw5lx2Kw9F5JA55Hk4JKsdyh81Ii3NIhfqIyHe0r0gvN2W5daS1MUDmCCLPhK80CFT';
        markAsSolved(stubSpec(compactUrl), 100);
        const records = getAllPuzzleRecords();
        expect(records[0].size).toEqual({ height: 12, width: 20 });
    });

    test('getAllPuzzleRecords: size is {0,0} when URL is unparseable', () => {
        markAsSolved(stubSpec('not-a-valid-url'), 100);
        const records = getAllPuzzleRecords();
        expect(records[0].size).toEqual({ height: 0, width: 0 });
    });

    test('getAllPuzzleRecords: ignores non-puzzle localStorage keys', () => {
        localStorage.setItem('dnd_height', '10');
        localStorage.setItem('other_key', 'value');
        markAsSolved(spec, 100);
        expect(getAllPuzzleRecords()).toHaveLength(1);
    });
});
