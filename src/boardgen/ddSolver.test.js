/**
 * Solver tests using a real 20×20 puzzle.
 *
 * Puzzle URL:
 *   ?h=20&w=20&p=CjUCBmCqKgKLXwpF5V4AAEV10eMYQYHOEoivYAXgQLTgxaOiRyFCpGJFxZoVCgwFFgY%3D
 *                &t=MTUsMi8xMyw1LzcsNy8xLDEwLzE4LDEwLzgsMTMvMiwxNC8xMSwxNg%3D%3D
 */

const { ddSolve, hasMultipleSolutions } = require('./ddSolver');
const { MutableGrid } = require('../utils/mutableGrid');
const { locFromStr } = require('./graphUtils');

/** Build a minimal DDBoardSpec suitable for the solver from raw URL params. */
function buildSpec(height, width, pBase64, tBase64) {
    const size = { height, width };

    // Decode walls from base64 (the legacy "stringEncoding" format).
    const walls = MutableGrid.fromString(size, pBase64);

    // Floors are the inverse of walls.
    const floors = walls.inverted();

    // Treasure locations: base64 → "x1,y1/x2,y2/..." → Location[]
    const treasureStr = Buffer.from(tBase64, 'base64').toString('utf-8');
    const treasureLocs = treasureStr.split('/').map(locFromStr);

    const treasure = MutableGrid.fromLocs(size, treasureLocs);

    // Dead-ends = leaves of the floor grid.
    const deadends = floors.leafGrid();

    return {
        rules: { size },
        walls,
        wallCounts: walls.profile(true),
        floorCounts: floors.profile(true),
        treasure,
        deadends,
        throneCount: treasureLocs.length,
    };
}

describe('ddSolver on a known 20×20 puzzle', () => {
    // Raw URL-decoded parameters
    const height = 20;
    const width = 20;
    const p = 'CjUCBmCqKgKLXwpF5V4AAEV10eMYQYHOEoivYAXgQLTgxaOiRyFCpGJFxZoVCgwFFgY=';
    const t = 'MTUsMi8xMyw1LzcsNy8xLDEwLzE4LDEwLzgsMTMvMiwxNC8xMSwxNg==';

    const spec = buildSpec(height, width, p, t);

    test('wall grid decodes to the correct dimensions', () => {
        expect(spec.walls.size).toEqual({ height: 20, width: 20 });
    });

    test('treasure decodes to the expected count', () => {
        expect(spec.treasure.trueLocs()).toHaveLength(8);
    });

    test('wall counts are consistent with the grid', () => {
        const { rows, cols } = spec.wallCounts;
        expect(rows).toHaveLength(20);
        expect(cols).toHaveLength(20);
        // Sum of all wall counts should equal total true cells in the wall grid.
        const totalWalls = spec.walls.trueLocs().length;
        const rowSum = rows.reduce((a, b) => a + b, 0);
        const colSum = cols.reduce((a, b) => a + b, 0);
        expect(rowSum).toBe(totalWalls);
        expect(colSum).toBe(totalWalls);
    });

    test('ddSolve finds at least one valid solution', () => {
        const solutions = ddSolve(spec, 10);
        expect(solutions.length).toBeGreaterThanOrEqual(1);
        // The original wall grid should be among the valid solutions.
        const matchesOriginal = solutions.some(s => s.wallGrid.equals(spec.walls));
        expect(matchesOriginal).toBe(true);
    });

    test('every solver solution has a connected floorplan', () => {
        const solutions = ddSolve(spec, 10);
        for (const s of solutions) {
            expect(s.wallGrid.inverted().componentCount()).toBe(1);
        }
    });

    test('hasMultipleSolutions correctly detects the ambiguity', () => {
        // This puzzle has 3 valid (connected-floorplan) solutions,
        // so hasMultipleSolutions should return true.
        expect(hasMultipleSolutions(spec)).toBe(true);
    });
});
