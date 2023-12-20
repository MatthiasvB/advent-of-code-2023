export function transpose<T>(matrix: T[][]) {
  const newMatrix = new Array<T[]>();
  let current = [];
  for (let colIndex = 0; colIndex < matrix[0].length; colIndex++) {
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      current.push(matrix[rowIndex][colIndex]);
    }
    newMatrix.push(current);
    current = [];
  }
  return newMatrix;
}

export function parseChallenge(input: string) {
  return transpose(input.trim().split("\n").map((line) => line.split("")));
}

type Point = readonly [number, number];

function pointEqual(a: Point, b: Point) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function pointToString(p: Point) {
  return `${p[0]}-${p[1]}`;
}

const navMap: Record<string, (p: Point) => [Point, Point] | undefined> = {
  "|": (p: Point) => [[p[0], p[1] - 1], [p[0], p[1] + 1]],
  "-": (p: Point) => [[p[0] - 1, p[1]], [p[0] + 1, p[1]]],
  "L": (p: Point) => [[p[0], p[1] - 1], [p[0] + 1, p[1]]],
  "J": (p: Point) => [[p[0], p[1] - 1], [p[0] - 1, p[1]]],
  "7": (p: Point) => [[p[0], p[1] + 1], [p[0] - 1, p[1]]],
  "F": (p: Point) => [[p[0], p[1] + 1], [p[0] + 1, p[1]]],
};

interface TwoSteps {
  prev: Point;
  curr: Point;
}

function gridAt(grid: string[][], p: Point) {
  return grid[p[0]][p[1]];
}

function walkFromVia(grid: string[][], position: TwoSteps): TwoSteps {
  const currentLocationSymbol = gridAt(grid, position.curr);
  const options = navMap[currentLocationSymbol]?.(position.curr);
  if (!options) {
    throw new Error(
      `Walked into a dead end at [${position.curr}], symbol "${currentLocationSymbol}"`,
    );
  }

  const next = pointEqual(options[0], position.prev) ? options[1] : options[0];
  return {
    prev: position.curr,
    curr: next,
  };
}

function isConnectedToStartingPosition(
  grid: string[][],
  p: Point,
  startingPoint: Point,
) {
  const mapper = navMap[gridAt(grid, p)];
  return !!mapper?.(p)?.some((option) => {
    const res = pointEqual(option, startingPoint);
    return res;
  });
}

function getStartingOptions(grid: string[][]): TwoSteps[] {
  let startingPoint: [number, number] | undefined;
  for (let l = 0; l < grid.length; l++) {
    for (let c = 0; c < grid[l].length; c++) {
      if (grid[l][c] === "S") {
        startingPoint = [l, c];
      }
    }
  }
  if (!startingPoint) throw new Error("Did not find the starting positions");

  const p = startingPoint;
  // deno-fmt-ignore
  return ([
    [p[0]-1, p[1]-1], [p[0], p[1]-1], [p[0]+1, p[1]-1],
    [p[0]-1, p[1]],                   [p[0]+1, p[1]],
    [p[0]-1, p[1]+1], [p[0], p[1]+1], [p[0]+1, p[1]+1]
  ] as const).filter(option => isConnectedToStartingPosition(grid, option, p)).map(pos => ({
    prev: p,
    curr: pos
  }));
}

function hasDuplicate(points: Point[]) {
  if (points.length < 2) return false;
  if (points.length === 2) return pointEqual(points[0], points[1]);

  const deduped = new Set(points.map(pointToString));

  return deduped.size !== points.length;
}

export function solve(input: string[][]): number {
  let steps = 1;
  let currentPoints = getStartingOptions(input);
  while (!hasDuplicate(currentPoints.map((el) => el.curr))) {
    currentPoints = currentPoints.map((p) => walkFromVia(input, p));
    steps++;
  }
  return steps;
}

export function solvePart2(input: string[][]): number {
  const original = input.map((x) => [...x]);
  markTunnel(input);
  console.log("After mark tunnel:", input.length, "x", input[0].length);
  // debugLogGrid(input);
  const extendedGrid = addBetweenSpots(input);
  const extendedOriginal = addBetweenSpots(original);
  // debugLogGrid(extendedOriginal);
  const insetGrid = surroundWithOuter(extendedGrid);
  const insetOriginal = surroundWithOuter(extendedOriginal);
  remarkTunnel(insetGrid, insetOriginal);
  console.log("After inset grid:", insetGrid.length, "x", insetGrid[0].length);
  // debugLogGrid(insetGrid);
  while (markAsOuter(insetGrid));
  return countInner(insetGrid);
}

function debugLogInsetGrid(grid: string[][]) {
  // console.log(grid);
  console.log(grid.length, "x", grid[0].length);
  console.log(
    transpose(grid).filter((_, idx) => idx % 2 === 1).map((line) =>
      line.filter((_, idx) => idx % 2 === 1).join("")
    ).join("\n"),
  );
}

function debugLogGrid(grid: string[][]) {
  // console.log(grid);
  console.log(
    transpose(grid).map((line) => line.join("")).join("\n"),
  );
}

function markTunnel(grid: string[][]) {
  let current = getStartingOptions(grid)[0];
  grid[current.prev[0]][current.prev[1]] = "T"; // Tunnel
  while (gridAt(grid, current.curr) !== "T") {
    current = walkFromVia(grid, current);
    grid[current.prev[0]][current.prev[1]] = "T";
  }
}

function addBetweenSpots(grid: string[][]) {
  // This adds more padding than required at 2 of four edges. But that doesn't hurt
  return grid.flatMap((col) => [
    col.flatMap((el) => [el, "B"]), // Between
    xTimesN("B", col.length * 2),
  ]);
}

function xTimesN<T>(x: T, n: number): T[] {
  const arr = new Array<T>();
  for (let i = 0; i < n; i++) {
    arr.push(x);
  }
  return arr;
}

function remarkTunnel(grid: string[][], original: string[][]) {
  for (let colIndex = 0; colIndex < grid.length; colIndex++) {
    for (let rowIndex = 0; rowIndex < grid[0].length; rowIndex++) {
      const current: Point = [colIndex, rowIndex];
      if (
        gridAt(grid, current) === 'B' &&
        (colIndex - 1 >= 0 && colIndex + 1 < grid.length) &&
        (rowIndex - 1 >= 0 && rowIndex + 1 < grid[0].length) &&
        ((isTunnelAndIsConnectedToMe(
          grid,
          original,
          [colIndex - 1, rowIndex],
          current,
        ) &&
          isTunnelAndIsConnectedToMe(
            grid,
            original,
            [colIndex + 1, rowIndex],
            current,
          )) ||
          (isTunnelAndIsConnectedToMe(
            grid,
            original,
            [colIndex, rowIndex - 1],
            current,
          ) &&
            isTunnelAndIsConnectedToMe(
              grid,
              original,
              [colIndex, rowIndex + 1],
              current,
            )))
      ) {
        grid[colIndex][rowIndex] = "T";
      }
    }
  }
}

function isTunnelAndIsConnectedToMe(
  grid: string[][],
  original: string[][],
  candidate: Point,
  self: Point,
) {
  if (gridAt(original, candidate) === 'S') return true;
  if (gridAt(grid, candidate) !== "T") {
    return false;
  }
  return !!navMap[gridAt(original, candidate)]?.(candidate)?.some((p) => {
    // console.log(p, self, pointEqual(p, self));
    return pointEqual(p, self);
  });
}

function surroundWithOuter(grid: string[][]) {
  const os = xTimesN("O", grid[0].length + 2); // Outer
  return [
    os,
    ...grid.map((col) => ["O", ...col, "O"]),
    os,
  ];
}

function markAsOuter(grid: string[][]) {
  let markedOuter = 0;
  for (let colIndex = 0; colIndex < grid.length; colIndex++) {
    for (let rowIndex = 0; rowIndex < grid[0].length; rowIndex++) {
      if (grid[colIndex][rowIndex] === "O") {
        markedOuter += markSurroundingAsOuter(grid, [colIndex, rowIndex]);
      }
    }
  }
  return markedOuter;
}

function markSurroundingAsOuter(grid: string[][], p: Point) {
  let count = 0;
  for (const cDelta of [-1, 0, 1]) {
    for (const rDelta of [-1, 0, 1]) {
      if (cDelta !== 0 || rDelta !== 0) {
        const x = p[0] + cDelta;
        const y = p[1] + rDelta;
        if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length) {
          if (!["T", "O"].includes(grid[p[0] + cDelta][p[1] + rDelta])) {
            grid[p[0] + cDelta][p[1] + rDelta] = "O";
            count++;
          }
        }
      }
    }
  }
  return count;
}

function countInner(grid: string[][]) {
  let count = 0;
  for (const col of grid) {
    for (const el of col) {
      if (!["O", "T", "B"].includes(el)) {
        count++;
      }
    }
  }
  return count;
}
