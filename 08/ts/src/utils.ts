export interface LeftRight {
  L: string;
  R: string;
}

interface Itertool {
    fullRangeTarget: string;
    endInZAfter: number;
}

// stolen from https://stackoverflow.com/questions/31302054/how-to-find-the-least-common-multiple-of-a-range-of-numbers
function leastCommonMultiple(numbers: number[]) {

  function gcd(a: number, b: number): number {
      return !b ? a : gcd(b, a % b);
  }

  function lcm(a: number, b: number) {
      return (a * b) / gcd(a, b);   
  }

  return numbers.reduce((multiple, num) => lcm(multiple, num), 1);
}

export class Walker {
  constructor(
    private readonly walkInstructions: string,
    private readonly leftRightMap: Map<string, LeftRight>
  ) {

  }

  private haveSameZDistance(currents: string[], itertools: Map<string, Itertool>) {
    const zDistance0 = itertools.get(currents[0])?.endInZAfter;
    if (!zDistance0) throw new Error("Could not get z-Distance");

    for (let i = 1; i < currents.length; i++) {
        if (itertools.get(currents[i])?.endInZAfter !== zDistance0) return false;
    }
    return true;
  }

  private minZDistance(currents: string[], itertools: Map<string, Itertool>) {
    return Math.min(...currents.map(current => itertools.get(current)!.endInZAfter))
  }

  public iterFastEndInZ() {
    let steps = 0;
    let currents = [...this.leftRightMap.keys()].filter((key) =>
      key.endsWith("A")
    );

    const itertools = this.getFastItertools();

    let debugIter = 0;

    while (!this.haveSameZDistance(currents, itertools)) {
        steps += this.walkInstructions.length;
        // Doing assertion because this is performance-critical and not large project
        currents = currents.map(current => itertools.get(current)!.fullRangeTarget);
        
        debugIter++;
        if (debugIter % 1_000_000 === 0) {
            console.log(`Have done ${debugIter} optimzed iterations`);
        }
    }
    // one more assertion
    return steps + itertools.get(currents[0])!.endInZAfter
  }

  public walkByJumpMap() {
    const jumpMap = this.getJumMap();

    let steps = 0;
    let currents = [...this.leftRightMap.keys()].filter((key) =>
      key.endsWith("A")
    );

    const itertools = this.getFastItertools();

    let debugIter = 0;

    while (!this.haveSameZDistance(currents, itertools)) {
        const minZDistance = this.minZDistance(currents, itertools);
        const jumpableDistance = minZDistance - (minZDistance % this.walkInstructions.length);
        if (jumpableDistance === 0) console.warn("stuck!")
        steps += jumpableDistance;
        // Doing assertion because this is performance-critical and not large project
        currents = currents.map(current => jumpMap.get(current)![jumpableDistance]);
        
        debugIter++;
        if (debugIter % 1_000_000 === 0) {
            console.log(`Have done ${debugIter} heavily optimized iterations: ${steps} steps`);
        }
    }
    // one more assertion
    return steps + itertools.get(currents[0])!.endInZAfter
  }

  public sanityCheck() {
    const itertools = this.getFastItertools();
    const x = [...this.leftRightMap.keys()].map(key => [itertools.get(key)!.endInZAfter, key] as const);

    const map = new Map<number, string[]>();
    x.forEach(el => {
        map.set(el[0], [...(map.get(el[0]) ?? []), el[1]])
    });

    const y = [...map.values()].filter(val => val.length === 6);

    if (y.length === 0) {
        console.error("No way this ever works");
    } else {
        console.log(`Sanity check succeeded. There are ${y.length} options`);
    }
  }

  private getJumMap() {
    const allKeys = [...this.leftRightMap.keys()]
    const allDistancesToZ = allKeys.map(key => this.walkFromTo(key, /Z$/)[0]);
    console.log(`All distances to Z: ${allDistancesToZ}`);

    const maxDistance = Math.max(...allDistancesToZ);
    const maxJumpableDistance = maxDistance - (maxDistance % this.walkInstructions.length);

    const jumpMap = allKeys.map(key => {
        const jumpList = new Array<string>(key);
        let current = key;
        for (let i = 0; i < maxJumpableDistance; i++) {
            // assertion!
            const next = this.leftRightMap.get(current)![this.walkInstructions[i % this.walkInstructions.length] as "L" | "R"];
            jumpList.push(next);
            current = next;
        }
        return [key, jumpList] as const;
    });
    jumpMap.forEach(item => {
        console.log(`Item ${item[0]} has jumplist of length ${item[1].length}: ${item[1].slice(0, 20)}...`);
    })
    return new Map(jumpMap);
  }

  private targetAfterFullLRRange(from: string) {
    let current = from;
    for (const char of this.walkInstructions) {
        const next = this.leftRightMap.get(current)?.[char as "R" | "L"];
        if (!next) {
            throw new Error("Something went wrong");
        }
        current = next;
    }
    return current;
  }

  private getFastItertools() {
    return new Map([...this.leftRightMap.keys()].map(key => {
        const fullRangeTarget = this.targetAfterFullLRRange(key);
        const endInZAfter = this.walkFromTo(key, /Z$/)[0];
        return [key, {
            fullRangeTarget,
            endInZAfter
        }];
    }));
  }

  public walkFromTo(from: string, to: RegExp): [number, string] {
    let current = from;
    let steps = 0;

    do {
      const next =
        this.leftRightMap.get(current)?.[
          this.walkInstructions[steps % this.walkInstructions.length] as
            | "L"
            | "R"
        ];
      if (!next) {
        throw new Error(`There is no next step to be found after ${current}`);
      }
      current = next;
      steps++;
    } while (!to.test(current));
    return [steps, current];
  }

  private doAllEndWithZ(locations: string[]) {
    return locations.every((location) => location.endsWith("Z"));
  }

  private numberOfZEndings(locations: string[]) {
    let zEndings = 0;
    for (const location of locations) {
        if (location.endsWith("Z")) {
            zEndings++;
        }
    }
    return zEndings;
  }

  public walkFromAllAToAllZ(): number {
    let currents = [...this.leftRightMap.keys()].filter((key) =>
      key.endsWith("A")
    );

    console.log(`Starting with ${currents}`);

    let steps = 0;
    do {
      const leftOrRight = this.walkInstructions[
        steps % this.walkInstructions.length
      ] as "L" | "R";
      currents = currents.map((current) => {
        const next = this.leftRightMap.get(current)?.[leftOrRight];
        if (!next) {
          throw new Error(`There is no next step to be found after ${current}`);
        }
        return next;
      });
      steps++;
      if (steps % 10_000_000 === 0) {
        console.log(`Done with step ${steps}\n-> ${currents}`);
      }
      const zEndings = this.numberOfZEndings(currents);
      if (zEndings > 2) {
        console.log(`Ending in Z: ${zEndings} of ${currents.length}`);
      }
    } while (this.numberOfZEndings(currents) !== currents.length);
    return steps;
  }

  public walkFromAllAToAllZOptimized() {
    const currents = [...this.leftRightMap.keys()].filter((key) =>
      key.endsWith("A")
    );
    currents.forEach(current => {
        console.log(`${current}: ${this.getCycleOffsetAndLength(current)}`);
    })
  }

  private getCycleOffsetAndLength(start: string) {
    const [offset, target] = this.walkFromTo(start, /Z$/);
    console.log(`${start} -> ${target}`);
    const [cycle] = this.walkFromTo(target, new RegExp(target));
    return [offset, cycle];
  }
}

export function parseChallenge(input: string) {
  const [lr, rawMap] = input.trim().split("\n\n");

  const mapParser = /^([A-Z]{3}) = \(([A-Z]{3}), ([A-Z]{3})\)$/;

  const map = new Map<string, LeftRight>(
    rawMap
      .split("\n")
      .map((line) => line.match(mapParser)?.slice(1))
      .filter((line): line is RegExpMatchArray => !!line)
      .map((matches) => [matches[0], { L: matches[1], R: matches[2] }])
  );

  return new Walker(lr, map);
}

export function solve(walker: Walker) {
  return walker.walkFromTo("AAA", /ZZZ/)[0];
}

export function solvePart2(walker: Walker) {
    return walker.walkFromAllAToAllZ();
}

export function solvePart2SomewhatOptimized(walker: Walker) {
    return walker.iterFastEndInZ()
}

export function solvePart2HeavilyOptimized(walker: Walker) {
    // return walker.walkByJumpMap();
    walker.sanityCheck();
}