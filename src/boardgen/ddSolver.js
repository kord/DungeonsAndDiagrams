import {MutableGrid} from "../utils/mutableGrid";
import {gridLocations, loc2Str, locFromStr} from "./graphUtils";

var Logic = require('logic-solver');

const locationGenerators = (size) => {
  return {
    row: (j) => {
      const ret = [];
      for (let i = 0; i < size.width; i++) ret.push(`${i},${j}`);
      return ret;
    },
    col: (i) => {
      const ret = [];
      for (let j = 0; j < size.height; j++) ret.push(`${i},${j}`);
      return ret;
    },
    onBoundary: (loc) => {
      return loc.x === 0 || loc.y === 0 || loc.x === size.width - 1 || loc.y === size.height - 1
    },
    boxCenteredAt: (loc) => {
      return [
        {x: loc.x - 1, y: loc.y - 1},
        {x: loc.x - 1, y: loc.y},
        {x: loc.x - 1, y: loc.y + 1},
        {x: loc.x, y: loc.y - 1},
        {x: loc.x, y: loc.y},
        {x: loc.x, y: loc.y + 1},
        {x: loc.x + 1, y: loc.y - 1},
        {x: loc.x + 1, y: loc.y},
        {x: loc.x + 1, y: loc.y + 1},
      ].filter(l => l.x >= 0 && l.y >= 0 && l.x < size.width && l.y < size.height);
    },
    fenceAround: (loc) => {
      return [
        {x: loc.x - 2, y: loc.y - 1},
        {x: loc.x - 2, y: loc.y},
        {x: loc.x - 2, y: loc.y + 1},
        {x: loc.x + 2, y: loc.y - 1},
        {x: loc.x + 2, y: loc.y},
        {x: loc.x + 2, y: loc.y + 1},
        {y: loc.y - 2, x: loc.x - 1},
        {y: loc.y - 2, x: loc.x},
        {y: loc.y - 2, x: loc.x + 1},
        {y: loc.y + 2, x: loc.x - 1},
        {y: loc.y + 2, x: loc.x},
        {y: loc.y + 2, x: loc.x + 1},
      ].filter(l => l.x >= 0 && l.y >= 0 && l.x < size.width && l.y < size.height);
    },

  }
};

const treasureString = (loc) => `istreasure${loc2Str(loc)}`;

// Solve a puzzle, leveraging a SAT solver to do the heavy lifting.
export function ddSolve(spec, maxSolutionsReturned = 5) {
  console.time('ddSolve');

  var solver = new Logic.Solver();

  let {size} = spec.rules;
  const {onBoundary, row, col, fenceAround, boxCenteredAt} = locationGenerators(size);

  const interior = gridLocations({height: size.height - 2, width: size.width - 2}, {x: 1, y: 1}).flat();
  const rim = gridLocations(size).filter(l => onBoundary(l, size)).flat();
  const treasureCount = spec.treasure.trueLocs().length;
  const deadEnds = spec.deadends.trueLocs();

  // Wallcount constraints for rows and columns.
  for (let j = 0; j < size.height; j++) {
    solver.require(
      Logic.equalBits(
        Logic.sum(row(j, size)),
        Logic.constantBits(spec.wallCounts.rows[j]))
    );
  }
  for (let i = 0; i < size.width; i++) {
    solver.require(
      Logic.equalBits(
        Logic.sum(col(i, size)),
        Logic.constantBits(spec.wallCounts.cols[i]))
    );
  }

  // Only the right number of treasure chests.
  solver.require(Logic.equalBits(
    Logic.sum(interior.map(treasureString)),
    Logic.constantBits(treasureCount)
  ));

  // Treasure room augmented vars.
  spec.treasure.trueLocs().forEach(treasure => {
    // Only the chest centers that are off boundary are real candidates.
    const tcandidates = boxCenteredAt(treasure, size).filter(loc => !onBoundary(loc, size));
    // Only one room per chest.
    solver.require(Logic.exactlyOne(tcandidates.map(treasureString)));
  });

  // No treasure in the outer rim.
  rim.forEach(tr => solver.require(Logic.not(treasureString(tr))));


  // Being the treasure room means no walls inside and mostly walls outside.
  interior.forEach(loc => {
    solver.require(Logic.implies(treasureString(loc),
      Logic.and(boxCenteredAt(loc, size).map(l => Logic.not(loc2Str(l))))));
    solver.require(Logic.implies(treasureString(loc), Logic.exactlyOne(fenceAround(loc, size).map(l => Logic.not(loc2Str(l))))));
  });

  const treasureRoomOriginsContainingMe = (loc) => {
    return [
      {x: loc.x + 1, y: loc.y + 1},
      {x: loc.x, y: loc.y + 1},
      {x: loc.x + 1, y: loc.y},
      {x: loc.x, y: loc.y},
    ].filter(l => !onBoundary(l, size));
  }

  // No 2x2 floor constraints.
  const twox2Origins = gridLocations({height: size.height - 1, width: size.width - 1}).flat();
  twox2Origins.forEach(loc => {
    const sq = gridLocations({height: 2, width: 2}, loc).flat();
    const thr = treasureRoomOriginsContainingMe(loc, size).map(treasureString);
    solver.require(Logic.or(...thr, ...sq.map(loc2Str)));
  });

  // Deadends
  gridLocations(size).flat().forEach(loc => {
    const locName = loc2Str(loc);
    const neighbours = spec.deadends.neighbourFunction(loc);
    const hasExactlyOneNeighbour = Logic.exactlyOne(neighbours.map(nl => Logic.not(loc2Str(nl))));
    if (spec.deadends.check(loc)) {
      // We're a known deadend.
      solver.forbid(locName);  // We can't be a wall.
      solver.require(hasExactlyOneNeighbour);
    } else {
      // If we're on the floor, we don't have exactly one neighbour.
      solver.require(Logic.implies(Logic.not(locName), Logic.not(hasExactlyOneNeighbour)));
    }
  });

  // Now we have to enforce the requirement that the floor space in the dungeon is connected. This is not
  // something that can be done in a clean efficient way in the SAT constraints, so we just generate solutions
  // and throw them out until we have one with a connected floorplan.
  let ret = [];
  {
    let soln;
    let solutionsFound = 0;
    soln = solver.solve();
    while (soln && solutionsFound < maxSolutionsReturned) {
      solutionsFound++;
      let deets = solutionDetails(size, soln);
      // If the solution isn't topologically sound, we can't include it in the solutions, and we have to keep looking.
      if (deets.wallGrid.inverted().componentCount() === 1) {
        ret.push(deets);
      }
      solver.forbid(soln.getFormula())
      soln = solver.solve();
    }
  }

  console.timeEnd('ddSolve');
  return ret;
}

export function hasMultipleSolutions(spec) {
  return ddSolve(spec, 2).length > 1;
}

function solutionDetails(size, soln) {
  const solnWalls = new MutableGrid(size, false);
  const treasure = soln.getTrueVars().filter(s => s[0] === 'i').map(s => locFromStr(s.substring('istreasure'.length)));
  soln.getTrueVars().filter(s => s[0] !== 'i').map(locFromStr).forEach(loc => solnWalls.setLoc(loc, true));

  return {
    wallGrid: solnWalls,
    thrones: treasure,
  }
}

