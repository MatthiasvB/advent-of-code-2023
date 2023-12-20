export function transpose<T>(matrix: T[][]) {
  const newMatrix = new Array<T[]>();
  let current = [];
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    for (let colIndex = 0; colIndex < matrix[0].length; colIndex++) {
      current.push(matrix[colIndex][rowIndex]);
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
