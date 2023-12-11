# How to _really_ solve the advent of code 2023 challenge day 8 part 2 (Spoiler!)

I'm doing the [advent of code](https://adventofcode.com/2023) challenges for the first time this year, and I enjoy them a lot! Thanks very much for setting them up, Eric Wastl!

They are hard. Much harder than I expected stuff to be, given that you gotta do one each day, next to work and life. But hey, so they are real challenges.

This is one of the reasons I'm quite lagging behind. I just finished day 8 on the 11th. But then, day 8 kinda sucked 😅.

In the following, I'm going to assume that you are familiar with the problem of ghosts on a desert island. Otherwise you shouldn't be here 😉

## What is the problem?

So, I implemented a naive version of the solution for part two and ran that for like an hour. It did not succeed. So I wrote an optimized and a crazy optimized version and ran the latter for 8 hours. No success. Well, I had made a mistake, but how would I have known? It did solve the tiny example challenge, after all.

So, I ended up peeking at others' solutions.

I did not like what I saw. They used an approach that made use of the least common multiple (lcm) of the amount of steps necessary to reach all `/Z$/` from all `/A$/` (I use TS, so `/.../` is a RegEx). And that works! That works GREAT.

But _should_ it work?

I had in fact considered tackling this with the lcm, but decided not to bother, because I figured the problem was too complex for it to be of use. And I still believe that was the right call.

Let's see what kind of data we need, for the lcm to be useful. I'll grab a snippet from [Todd Ginsberg's blog](https://todd.ginsberg.com/post/advent-of-code/2023/day8/) who explains the lcm solution using Kotlin:

```text
Route 22A = -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
Route 33A = --+--+--+--+--+--+--+--+--+--+--+--+--+-
Route 44A = ---+---+---+---+---+---+---+---+---+---+
```

This is what your challenge data must look like as you iterate for the lcm to work (`-` being `/[^Z]$/` and `+` being `/Z$/`). Notably

- the intervals from `/Z$/` to `/Z$/` must always be the same for a given starting point (weird)
- the distance from `/A$/` to `/Z$/` must be equal the length as `/Z$/` to `/Z$/` (**really** weird)

In short, there must be **a lot** more structure in the data than the prose suggests.

Is it reasonable to figure this out? I don't think so, even though clues exist. Take for example this select excerpt from my challenge, that already hints at some weirdness

```text
XSZ = (XVM, QRD)
QVA = (QRD, XVM)

BLZ = (LPN, XVJ)
VSA = (XVJ, LPN)

ZZZ = (MTL, KNJ)
AAA = (KNJ, MTL)

KKZ = (GDB, LRB)
VKA = (LRB, GDB)

RGZ = (RFP, RVX)
PBA = (RVX, RFP)

VQZ = (RDR, VRQ)
LSA = (VRQ, RDR)
```

the mappings from each of the `/A$/`s is almost identical to one of the `/Z$/`s, except inversed. That's how the distance from `a` in `/A$/` to `z` in `/Z$/` is equal to the distance of `z` to `z`.

And then, when you look at the individual `z` to `z` distances, you'll notice that they're each multiple of the length of the instruction set `LRRLLRRR...`.

So, I _guess_ looking really long and really hard at the data one could have figured out that lcm might be the go-to here. I didn't, though.

With the magical lcm knowledge, the solution is simply the least common multiple of all `a`-to-`z` distances.

## But how to solve the general problem?

My solution to part 2 was `10_668_805_667_831`. That is a _really big_ number! Can we process the challenge in a way that allows us to iterate quickly enough to find a solution within our lifetime, and ideally before Christmas?

It turns out, the answer is yes.

I had run my optimized algorithm for the entire night without finding the solution. Luckily, that was due to a bug. And since I had peeked and found a way to quickly if dirtily get the right answer, I could now better debug my code because I knew when I went too far. Of course, the error was trivial (not interesting to discuss here). So here's how the **real solution** goes:

First of all, we are not going to do any crazy maths stuff. We stick to cool data structures and some heavy pre-processing that'll speed up our iterations by a factor of about 20k (in my case).

Simply put, the strategy is easy: 

1. find a `z`
2. check if for all candidates the next `z` has the same distance from where we are
3. if yes, we are done, else, continue
4. for all (6) candidates, jump so far ahead that we (nearly) reach the upcoming `z` that is the furthest away
5. go to 2

of course _how_ we are going to efficiently know how far the next `z`s are away and _do_ those jumps is not so trivial.

Basically, for all candidates we generate a "jump table" that contains the locations at which we end up if we jump `n * length_of_lr_instruction_set` steps ahead. How large is `n`? Well, large enough so we can jump the largest distance it takes from any location to get to a `z`. In my case, that's just above 20k. 

This of course makes some assumptions, too. Mainly that there are no cycles. And that this number can be computed in reasonable time for all locations.

We are also going to pre-compute the distance it takes from any location to the next `z`.

With these two sets of information, we can easily figure out 

- if we are very close to the solution (all upcoming `z` distances the same)
- how far we can safely jump without skipping the solution
- where to jump to (we can only jump in multiples of `length_of_lr_instruction_set`)

With this approach, it took me just under 8 minutes to find the solution.

In TS, here's what that looks like:


```typescript
export interface LeftRight {
  L: string;
  R: string;
}

interface Itertool {
  /** How long until we are at /Z$/. Zero if we are at /Z$/ */
  endInZAfter: number;
  /** How long to the next /Z$/. Never zero, otherwise as above. */
  nextZ: number;
}

type ItertoolMap = Map<string, Itertool>;

const debug = false;

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

  private getItertools(): ItertoolMap {
    return new Map(
      [...this.leftRightMap.keys()].map((key) => {
        const endInZAfter = this.walkFromTo(key, /Z$/);
        const nextZ = this.walkFromTo(key, /Z$/, true);
        return [
          key,
          {
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
 */
export function solvePart2HeavilyOptimized(walker: Walker) {
  return walker.walkByJumpMap();
}

 ```

You can also check out my [aoc repo](https://github.com/MatthiasvB/advent-of-code-2023). I'm using TS/Deno because I'm most familiar with TS and like Deno, but occasionally I might sprinkle in some other stuff.

I hope you liked this article and wish you a merry advent and lots of fun coding!