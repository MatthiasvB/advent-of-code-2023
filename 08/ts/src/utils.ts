import { assert } from "node:console";

export interface LeftRight {
  L: string;
  R: string;
}

const debug = true;

interface Itertool {
  fullRangeTarget: string;
  endInZAfter: number;
  nextZ: number;
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
  ) {}

  private haveSameZDistance(
    currents: string[],
    itertools: Map<string, Itertool>
  ) {
    const zDistance0 = itertools.get(currents[0])?.endInZAfter;
    if (zDistance0 === null || zDistance0 === undefined) throw new Error("Could not get z-Distance");

    for (let i = 1; i < currents.length; i++) {
      if (itertools.get(currents[i])?.endInZAfter !== zDistance0) return false;
    }
    return true;
  }

  private maxZDistance(currents: string[], itertools: Map<string, Itertool>) {
    return Math.max(
      ...currents.map((current) => itertools.get(current)!.nextZ)
    );
  }

  public iterFastEndInZ() {
    let steps = 0;
    let currents = this.getAllLocationsMatching(/A$/);

    const itertools = this.getFastItertools();

    console.log("Itertools:", itertools);

    let debugIter = 0;

    while (!this.haveSameZDistance(currents, itertools)) {
      steps += this.walkInstructions.length;
      // Doing assertion because this is performance-critical and not large project
      currents = currents.map(
        (current) => itertools.get(current)!.fullRangeTarget
      );

      debugIter++;
      if (debugIter % 1_000_000 === 0) {
        console.log(`Have done ${debugIter} optimzed iterations`);
      }
    }
    // one more assertion
    return steps + itertools.get(currents[0])!.endInZAfter;
  }

  public magicSolve() {
    const allEndingInA = this.getAllLocationsMatching(/A$/);

    const zDistances = allEndingInA.map(location => this.walkFromTo(location, /Z$/)[0]);

    const magicSolution = leastCommonMultiple(zDistances); // This so not the general solution to the problem!
    return magicSolution;
  }

  public walkByJumpMap(approximateMaxDistance = Infinity) {
    const jumpMap = this.getJumMap();

    let steps = 0;
    let currents = this.getAllLocationsMatching(/A$/);

    const itertools = this.getFastItertools();

    let debugIter = 0;

    while (!this.haveSameZDistance(currents, itertools)) {
      let c1 = currents, c2 = currents, c3 = currents;
      const maxZDistance = this.maxZDistance(currents, itertools);
      const fullLengthJumps = Math.floor(
        maxZDistance / this.walkInstructions.length
      );
      if (fullLengthJumps === 0) console.warn("stuck!");
      steps += fullLengthJumps * this.walkInstructions.length;

      const knownSolution = 10868805667831;
      if (steps >= knownSolution) {
        console.log("Making a mistake now. Why didn't I exit?");
        console.log(c3);
        console.log(c2);
        console.log(c1);
        console.log(currents);
        currents.forEach(current => {
          console.log(`${current} will go to Z$ after ${itertools.get(current)?.endInZAfter}`);
        });
        throw new Error("Went too far!");
      }
      c3 = c2;
      c2 = c1;
      c1 = currents
      // Doing assertion because this is performance-critical and not large project
      currents = currents.map(
        (current) => jumpMap.get(current)![fullLengthJumps]
      );

      if (steps >= approximateMaxDistance) {
        return [steps, currents] as const;
      }

      debugIter++;
      if (debugIter % 1_000_000 === 0) {
        console.log(
          `Have done ${debugIter} heavily optimized iterations: ${steps} steps.
Last one was by ${fullLengthJumps} full length jumps. That's ${fullLengthJumps * this.walkInstructions.length} steps.`
        );
        console.log(currents);
      }
    }
    // one more assertion
    return [steps + itertools.get(currents[0])!.endInZAfter, []] as const;
  }

  public sanityCheck() {
    const itertools = this.getFastItertools();
    const x = [...this.leftRightMap.keys()].map(
      (key) => [itertools.get(key)!.endInZAfter, key] as const
    );

    const map = new Map<number, string[]>();
    x.forEach((el) => {
      map.set(el[0], [...(map.get(el[0]) ?? []), el[1]]);
    });

    const y = [...map.values()].filter((val) => val.length === 6);

    if (y.length === 0) {
      console.error("No way this ever works");
    } else {
      console.log(`Sanity check succeeded. There are ${y.length} options`);
    }
  }

  private getJumMap() {
    const allKeys = [...this.leftRightMap.keys()];
    const allDistancesToZ = allKeys.map((key) => this.walkFromTo(key, /Z$/)[0]);

    // sanity check
    // if (debug) {
    //   allDistancesToZ.forEach((distance) => {
    //     if (distance === 0) {
    //       throw new Error("Sanity check failed. Distance to Z with 0 found!");
    //     }
    //   });
    // }

    const maxDistance = Math.max(...allDistancesToZ);
    const maxJumpableDistance =
      maxDistance - (maxDistance % this.walkInstructions.length);

    assert(maxJumpableDistance % this.walkInstructions.length === 0, "maxJumpableDistance is not a multiple of the instruction length");

    const jumpMap = allKeys.map((key) => {
      const jumpList = new Array<string>(key);
      let current = key;
      for (let i = 0; i < maxJumpableDistance; i++) {
        // assertion!
        const next =
          this.leftRightMap.get(current)![
            this.walkInstructions[i % this.walkInstructions.length] as "L" | "R"
          ];
        if ((i+1) % this.walkInstructions.length === 0) jumpList.push(next);
        current = next;
      }
      return [key, jumpList] as const;
    });
    // jumpMap.forEach((item) => {
    //   console.log(
    //     `Item ${item[0]} has jumplist of length ${
    //       item[1].length
    //     }: ${item[1].slice(0, 20)}...`
    //   );
    // });
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
    return new Map(
      [...this.leftRightMap.keys()].map((key) => {
        const fullRangeTarget = this.targetAfterFullLRRange(key);
        const endInZAfter = this.walkFromTo(key, /Z$/)[0];
        const nextZ = this.walkFromTo(key, /Z$/, true)[0];
        return [
          key,
          {
            fullRangeTarget,
            endInZAfter,
            nextZ
          },
        ];
      })
    );
  }

  public walkFromTo(from: string, to: RegExp, forceWalk = false): [number, string] {
    let current = from;
    let steps = 0;

    while (!to.test(current) || (forceWalk && steps === 0)) {
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
    };
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

  private getAllLocationsMatching(matcher: RegExp) {
    return [...this.leftRightMap.keys()].filter((key) => matcher.test(key));
  }

  public walkFromAllAToAllZ(maxSteps = Infinity): [number, string[]] {
    let currents = this.getAllLocationsMatching(/A$/);

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
      if (steps === maxSteps) {
        return [steps, currents];
      }
      if (steps % 10_000_000 === 0) {
        console.log(`Done with step ${steps}\n-> ${currents}`);
      }
      const zEndings = this.numberOfZEndings(currents);
      if (zEndings > 2) {
        console.log(`Ending in Z: ${zEndings} of ${currents.length}`);
      }
    } while (this.numberOfZEndings(currents) !== currents.length);
    return [steps, []];
  }

  public walkFromAllAToAllZOptimized() {
    const currents = [...this.leftRightMap.keys()].filter((key) =>
      key.endsWith("A")
    );
    currents.forEach((current) => {
      console.log(`${current}: ${this.getCycleOffsetAndLength(current)}`);
    });
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

  const mapParser = /^([A-Z0-9]{3}) = \(([A-Z0-9]{3}), ([A-Z0-9]{3})\)$/;

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
  return walker.iterFastEndInZ();
}

export function solvePart2HeavilyOptimized(walker: Walker) {
  return walker.walkByJumpMap();
  // walker.sanityCheck();
}

export function magicSolvePart2(walker: Walker) {
  return walker.magicSolve();
}
