import {MutableGrid} from "./mutableGrid";
import {gridLocations, loc2Str, locFromStr} from "./graphUtils";

var Logic = require('logic-solver');


// export type DDBoardSpec = {
//   // The rules that were used to generate this board.
//   rules: DDBoardgenSpec,
//   floors: MutableGrid,
//   walls: MutableGrid,
//
//   throneCount: number,
//   throneCenters: MutableGrid,
//   treasure: MutableGrid,
//   deadends: MutableGrid,
//
//   wallCounts: Linestats,
//
//   restarts: number,
// }

function row(j, size) {
  const ret = [];
  for (let i = 0; i < size.width; i++) ret.push(`${i},${j}`);
  return ret;
}

function col(i, size) {
  const ret = [];
  for (let j = 0; j < size.height; j++) ret.push(`${i},${j}`);
  return ret;
}

function boxCenteredAt(loc, gridSize) {
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
  ].filter(l => l.x >= 0 && l.y >= 0 && l.x < gridSize.width && l.y < gridSize.height);
}

function onBoundary(loc, size) {
  return loc.x == 0 || loc.y == 0 || loc.x == size.width - 1 || loc.y == size.height - 1;
}

function fenceAround(loc, gridSize) {
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
  ].filter(l => l.x >= 0 && l.y >= 0 && l.x < gridSize.width && l.y < gridSize.height);
}

const treasureString = (loc) => `istreasure${loc2Str(loc)}`;

export function ddSolve(spec) {
  var solver = new Logic.Solver();

  let {size} = spec.rules;

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

  // Treasure room augmented vars.
  spec.treasure.trueLocs().forEach(treasure => {
    // Only the chest centers that are off boundary are real candidates.
    const tcandidates = boxCenteredAt(treasure, size).filter(loc => !onBoundary(loc, size));
    // Only one room per chest.
    solver.require(Logic.exactlyOne(tcandidates.map(treasureString)));
  });

  // No treasure in the outer rim.
  const interior = gridLocations({height: size.height - 2, width: size.width - 2}, {x: 1, y: 1});
  const rim = gridLocations(size).filter(l => onBoundary(l, size));

  rim.forEach(tr => solver.require(Logic.not(treasureString(tr))));

  console.log(`True treasure count ${spec.treasure.trueLocs().length}`)

  // Being the treasure room means no walls inside and mostly walls outside.
  interior.forEach(loc => {
    solver.require(Logic.implies(treasureString(loc),
      Logic.and(boxCenteredAt(loc, size).map(l => Logic.not(loc2Str(l))))));
    solver.require(Logic.implies(treasureString(loc), Logic.exactlyOne(fenceAround(loc, size).map(l => Logic.not(loc2Str(l))))));
  });

  // // Only the right number of treasure chests.
  // solver.require(Logic.equalBits(
  //   Logic.sum(interior.map(treasureString)),
  //   Logic.constantBits(spec.treasure.trueLocs().length)
  // ));

  const thronesContainingMe = (loc) => {
    return [
      {x: loc.x + 1, y: loc.y + 1},
      {x: loc.x, y: loc.y + 1},
      {x: loc.x + 1, y: loc.y},
      {x: loc.x, y: loc.y},
    ].filter(l => !onBoundary(l, size));
  }

  // No 2x2 floor constraints.
  // TODO: These have to be short-circuited within the treasure rooms. Shit.
  const twox2Origins = gridLocations({height: size.height - 1, width: size.width - 1}).flat();
  twox2Origins.forEach(loc => {
    const sq = gridLocations({height: 2, width: 2}, loc).flat();
    const thr = thronesContainingMe(loc, size).map(treasureString);
    solver.require(Logic.or(...thr, ...sq.map(loc2Str)));
  });

  // Deadends
  gridLocations(size).flat().forEach(loc => {
    const s = loc2Str(loc);
    const ns = spec.deadends.nf(loc);
    const hasExactlyOneNeighbour = Logic.exactlyOne(ns.map(nl => Logic.not(loc2Str(nl))));
    if (spec.deadends.check(loc)) {
      // We're a known deadend.
      solver.require(Logic.not(s));
      solver.require(hasExactlyOneNeighbour);
    } else {
      // If we have exactly one neighbour, we must just be a wall.
      solver.require(Logic.implies(hasExactlyOneNeighbour, s));
    }
  })


  // Treasure
  // TODO

  // Grab a solution and dump it in a grid for inspection.
  let soln = solver.solve();

  if (!soln) {
    console.warn(`Solution didn't work...`);
    return;
  }

  const solnWalls = new MutableGrid(size, false);

  const treasure = soln.getTrueVars().filter(s => s[0] == 'i').map(s => locFromStr(s.substring('istreasure'.length)));
  console.log('Treasure!', treasure.map(loc2Str).join('  '))
  // console.log(soln.getTrueVars().join(' '))

  soln.getTrueVars().filter(s => s[0] != 'i').map(locFromStr).forEach(loc => solnWalls.setLoc(loc, true));

  let sln = {
    wallGrid: solnWalls,
    thrones: treasure,
  }

  return sln;
}


