export interface LeftRight {
  L: string;
  R: string;
}

interface Itertool {
  /** Where we end up after all "LRLLLRRL..." instructions */
  fullRangeTarget: string;
  /** How long until we are at /Z$/. Zero if we are at /Z$/ */
  endInZAfter: number;
  /** How long to the next /Z$/ */
  nextZ: number;
}

type ItertoolMap = Map<string, Itertool>

const debug = false;

// inspired by https://stackoverflow.com/questions/31302054/how-to-find-the-least-common-multiple-of-a-range-of-numbers
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
  private readonly itertools: Map<string, Itertool>;
  constructor(
    private readonly walkInstructions: string,
    private readonly leftRightMap: Map<string, LeftRight>,
  ) {
    this.itertools = this.getItertools();
  }

  public walkFromTo(from: string, to: RegExp, forceWalk = false): number {
    let current = from;
    let steps = 0;

    while (!to.test(current) || (forceWalk && steps === 0)) {
      const next = this.leftRightMap.get(current)?.[
        this.walkInstructions[steps % this.walkInstructions.length] as
          | "L"
          | "R"
      ];
      if (!next) {
        throw new Error(`There is no next step to be found after ${current}`);
      }
      current = next;
      steps++;
    }
    return steps;
  }

  /** Not optimized */
  public walkFromAllAToAllZ(maxSteps = Infinity): number {
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
        return steps;
      }
      if (steps % 10_000_000 === 0) {
        console.log(`Done with step ${steps}\n-> ${currents}`);
      }
    } while (this.numberOfZEndings(currents) !== currents.length);
    return steps;
  }

  /** Somewhat optimized (factor 280) */
  public iterFastEndInZ() {
    let steps = 0;
    let currents = this.getAllLocationsMatching(/A$/);

    const itertools = this.getItertools();

    let debugIter = 0;

    while (!this.haveSameZDistance(currents)) {
      steps += this.walkInstructions.length;
      // Doing assertion because this is performance-critical and not large project
      currents = currents.map(
        (current) => itertools.get(current)!.fullRangeTarget,
      );

      if (debug) {
        debugIter++;
        if (debugIter % 1_000_000 === 0) {
          console.log(`Have done ${debugIter} optimzed iterations`);
        }
      }
    }
    // one more assertion
    return steps + itertools.get(currents[0])!.endInZAfter;
  }

  /** Heavily optimized (factor 20k) */
  public walkByJumpMap() {
    const jumpMap = this.getJumMap();

    let steps = 0;
    let currents = this.getAllLocationsMatching(/A$/);

    const itertools = this.getItertools();

    let debugIter = 0;

    while (!this.haveSameZDistance(currents)) {
      const maxZDistance = this.maxZDistance(currents, this.itertools);
      const fullLengthJumps = Math.floor(
        maxZDistance / this.walkInstructions.length,
      );
      if (fullLengthJumps === 0) console.warn("stuck!");
      steps += fullLengthJumps * this.walkInstructions.length;

      // Doing assertion because this is performance-critical and not a large project
      currents = currents.map(
        (current) => jumpMap.get(current)![fullLengthJumps],
      );

      debugIter++;
      if (debug) {
        if (debugIter % 1_000_000 === 0) {
          console.log(
            `Have done ${debugIter} heavily optimized iterations: ${steps} steps.
Last one was by ${fullLengthJumps} full length jumps. That's ${
              fullLengthJumps * this.walkInstructions.length
            } steps.`,
          );
          console.log(currents);
        }
      }
    }
    // one more assertion
    return steps + itertools.get(currents[0])!.endInZAfter;
  }

  /** Dirty wizardry (factor infinity) */
  public magicSolve() {
    const allEndingInA = this.getAllLocationsMatching(/A$/);

    const zDistances = allEndingInA.map((location) =>
      this.walkFromTo(location, /Z$/)
    );

    // This is so not the general solution to the problem!
    const magicSolution = leastCommonMultiple(zDistances);
    return magicSolution;
  }

  private haveSameZDistance(currents: string[]) {
    const zDistance0 = this.itertools.get(currents[0])?.endInZAfter;
    if (zDistance0 === null || zDistance0 === undefined) {
      throw new Error("Could not get z-Distance");
    }

    for (let i = 1; i < currents.length; i++) {
      if (this.itertools.get(currents[i])?.endInZAfter !== zDistance0) {
        return false;
      }
    }
    return true;
  }

  private maxZDistance(currents: string[], itertools: Map<string, Itertool>) {
    return Math.max(
      ...currents.map((current) => itertools.get(current)!.nextZ),
    );
  }

  private getJumMap() {
    const allKeys = [...this.leftRightMap.keys()];
    const allDistancesToZ = allKeys.map((key) => this.walkFromTo(key, /Z$/));

    const maxDistance = Math.max(...allDistancesToZ);
    const maxJumpableDistance = maxDistance -
      (maxDistance % this.walkInstructions.length);

    const jumpMap = allKeys.map((key) => {
      const jumpList = new Array<string>(key);
      let current = key;
      for (let i = 0; i < maxJumpableDistance; i++) {
        // assertion!
        const next = this.leftRightMap.get(current)![
          this.walkInstructions[i % this.walkInstructions.length] as "L" | "R"
        ];
        if ((i + 1) % this.walkInstructions.length === 0) jumpList.push(next);
        current = next;
      }
      return [key, jumpList] as const;
    });
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

  private getItertools(): ItertoolMap {
    return new Map(
      [...this.leftRightMap.keys()].map((key) => {
        const fullRangeTarget = this.targetAfterFullLRRange(key);
        const endInZAfter = this.walkFromTo(key, /Z$/);
        const nextZ = this.walkFromTo(key, /Z$/, true);
        return [
          key,
          {
            fullRangeTarget,
            endInZAfter,
            nextZ,
          } satisfies Itertool,
        ];
      }),
    );
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
}

export function parseChallenge(input: string) {
  const [lr, rawMap] = input.trim().split("\n\n");

  const mapParser = /^([A-Z0-9]{3}) = \(([A-Z0-9]{3}), ([A-Z0-9]{3})\)$/;

  const map = new Map<string, LeftRight>(
    rawMap
      .split("\n")
      .map((line) => line.match(mapParser)?.slice(1))
      .filter((line): line is RegExpMatchArray => !!line)
      .map((matches) => [matches[0], { L: matches[1], R: matches[2] }]),
  );

  return new Walker(lr, map);
}

export function solve(walker: Walker) {
  return walker.walkFromTo("AAA", /ZZZ/);
}

/**
 * This probably solves the challenge. My estimate is that it would take
 * on the order of 100 days (my 7.45 minutes of optimized runtime times
 * my speedup factor of some 20k).
 *
 * @param walker
 * @returns
 */
export function solvePart2(walker: Walker) {
  return walker.walkFromAllAToAllZ();
}

/**
 * Probably (untested) solve challenge with a speedup factor
 * equal to the length of the "LRLLRR..." instruction set,
 * so about 280
 *
 * @param walker
 * @returns
 */
export function solvePart2SomewhatOptimized(walker: Walker) {
  return walker.iterFastEndInZ();
}

/**
 * Find a general solution to day 8 part 2 without making
 * any crazy assumptions about the structure of the challenge
 * data. This uses a speedup compared to naively iterating of
 * greatest number of iterations that a location ending in Z
 * takes to end up at another /Z$/. In _this_ challenge, it
 * happens that /Z$/ always ends up at itself. It also happens
 * that it always does this after n * (length of instruction set)
 * steps where n is a fixed integer. So, in my case the speedup is
 * 73 * 283 = 20659. That solves the challenge in just under 8 minutes.
 *
 * @param walker
 * @returns
 */
export function solvePart2HeavilyOptimized(walker: Walker) {
  return walker.walkByJumpMap();
}

/**
 * This is the solution everybody uses. It makes the assumptions that
 * - `z` in /Z$/ ends up at `z` again after a fixed amount steps, as opposed to variable intervals
 * - `a` in /A$/ ends up at `z` in /Z$/ after the same amount of steps that it takes to get from `z` to `z` (crazy!!)
 *
 * These two assupmtions mean that we just need the least common multiple of all `d` where `d`
 * are the distances from /A$/ to /Z$/.
 *
 * Given this assumption, the runtime becomes negligible.
 *
 * @param walker
 * @returns
 */
export function magicSolvePart2(walker: Walker) {
  return walker.magicSolve();
}
