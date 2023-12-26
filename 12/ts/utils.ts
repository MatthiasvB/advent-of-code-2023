import { faktor, sum, xTimesN } from "../../utils.ts";

export function groupsToRegex(groups: number[]) {
  return new RegExp(
    [
      "^\\.*",
      ...groups.map((n) => `#{${n}}`).join("\\.+"),
      "\\.*$",
    ].join(""),
  );
}

export function groupsToRegexOptimized(groups: number[]) {
  return new RegExp(
    [
      "^[.?]*",
      ...groups.map((n) => `[#?]{${n}}`).join("[.?]+"),
      "[.?]*$",
    ].join(""),
  );
}

export function groupsToRegexOpenEnd(groups: number[]) {
  return new RegExp(
    [
      "^[.?]*",
      ...groups.map((n) => `[#?]{${n}}`).join("[.?]+"),
    ].join(""),
  );
}

export function getNumberOfCombinations(input: string, regex: RegExp) {
  return x(input, (arg: string) => regex.test(arg));
}

export function getNumberOfCombinationsOptimized(input: string, regex: RegExp) {
  return xOptimized(input, (arg: string) => regex.test(arg));
}

function xOptimized(input: string, cb: (arg: string) => boolean): number {
  if (!cb(input)) return 0;

  if (input.includes("?")) {
    const options = [input.replace("?", "."), input.replace("?", "#")];
    return sum(options.map((option) => xOptimized(option, cb)));
  }
  return 1;
}

function x(input: string, cb: (arg: string) => boolean): number {
  if (input.includes("?")) {
    const options = [input.replace("?", "."), input.replace("?", "#")];
    return sum(options.map((option) => x(option, cb)));
  }
  return cb(input) ? 1 : 0;
}

interface Entry {
  pattern: string;
  groups: number[];
}

export function parseChallenge(input: string) {
  return input.trim().split("\n").map((line): Entry => {
    const [pattern, groups] = line.split(" ");
    const parsedGroups = groups.split(",").map((group) => +group);
    return {
      pattern,
      groups: parsedGroups,
    };
  });
}

enum Consumption {
  Not,
  Yes,
  CouldBe,
  NotThisRound,
  ThisOneYes,
}

interface Segment {
  segment: string;
  consumed: Consumption;
}

interface BrokenGroup {
  size: number;
  consumed: Consumption;
}

interface ConsumableEntry {
  segments: Segment[];
  groups: BrokenGroup[];
}

export function parseChallengeForOptimizedApproach(
  input: string,
  numberFolds: number,
): ConsumableEntry[] {
  return input.trim().split("\n").map((line) => {
    const [pattern, groups] = line.split(" ");
    const parsedGroups = xTimesN(groups, numberFolds).join(",").split(",").map((
      size,
    ): BrokenGroup => ({
      size: +size,
      consumed: Consumption.Not,
    }));
    return {
      segments: xTimesN(pattern, numberFolds).join("?").split(/\.+/).filter(
        (s) => !!s.trim().length,
      ).map((
        segment,
      ): Segment => ({ segment, consumed: Consumption.Not })),
      groups: parsedGroups,
    };
  });
}

export function solveOptimized(entries: ConsumableEntry[]): number {
  return sum(entries.map((entry) => {
    const combinations = [0];

    for (const [idx, segment] of entry.segments.entries()) { // iterate segments
      const notConsumedGroups = entry.groups.filter((g) =>
        g.consumed !== Consumption.Yes
      );
      const regex = groupsToRegexOptimized(
        notConsumedGroups.map((group) => group.size),
      );
      //   console.log("Regex:", regex);
      const pre = entry.segments.slice(0, idx).filter((s) =>
        s.consumed !== Consumption.Yes
      ).map((s) => s.segment).join(".");
      const post = entry.segments.slice(idx + 1).map((s) => s.segment).join(
        ".",
      );
      for (
        const candidateSegment of possibleCombinations(
          pre,
          segment.segment,
          post,
          regex,
        )
      ) {
        const candidate = `${pre}.${candidateSegment}.${post}`;
        if (regex.test(candidate)) {
          //   console.log(`Yes: ${candidate}`);
          combinations[combinations.length - 1] += 1;
          for (let i = 0; i < notConsumedGroups.length; i++) {
            const innerRegex = groupsToRegexOpenEnd(
              notConsumedGroups.slice(0, i + 1).map((g) => g.size),
            );
            const matchesSegment = innerRegex.test(candidateSegment);
            notConsumedGroups[i].consumed = getConsumption(
              notConsumedGroups[i].consumed,
              matchesSegment,
            );
            if (!matchesSegment) break;
          }
        } else {
          //   console.log(`No : ${candidate}`);
        }
      }
      let segmentDirty = false;
      for (const group of notConsumedGroups) {
        switch (group.consumed) {
          case Consumption.CouldBe: {
            group.consumed = Consumption.ThisOneYes;
            break;
          }
          case Consumption.NotThisRound: {
            group.consumed = Consumption.Not;
            segmentDirty = true;
            break;
          }
        }
      }
      if (
        !segmentDirty &&
        notConsumedGroups.every((g) =>
          [Consumption.ThisOneYes, Consumption.Not].includes(g.consumed)
        )
      ) {
        segment.consumed = Consumption.Yes;
        notConsumedGroups.forEach((g) => {
          g.consumed = g.consumed === Consumption.ThisOneYes
            ? Consumption.Yes
            : g.consumed;
          //   console.log("Cutting a group:", g.size);
        });
        // console.log("Cutting a segment");
        combinations.push(0);
      }
      notConsumedGroups.forEach((g) => {
        g.consumed = g.consumed === Consumption.ThisOneYes
          ? Consumption.Not
          : g.consumed;
      });
    }
    console.log(combinations);
    return faktor(combinations.filter((c) => !!c));
  }));
}

function getConsumption(current: Consumption, nowConsumed: boolean) {
  switch (current) {
    case Consumption.Not:
      return nowConsumed ? Consumption.CouldBe : Consumption.NotThisRound;
    case Consumption.Yes:
      return Consumption.Yes;
    case Consumption.CouldBe:
      return nowConsumed ? Consumption.CouldBe : Consumption.NotThisRound;
    case Consumption.NotThisRound:
      return Consumption.NotThisRound;
    case Consumption.ThisOneYes: {
      throw new Error("Trying to determine new state at incorrect moment");
    }
    default: {
      // deno-lint-ignore no-unused-vars
      const exhaustivenessCheck: never = current;
    }
  }
  throw new Error("Non exhaustive switch-case");
}

function* possibleCombinations(
  pre: string,
  segment: string,
  post: string,
  regex: RegExp,
): Generator<string> {
  if (!segment.includes("?")) {
    // console.log(`Segment is ${segment}`);
    // console.log("Yielding");
    yield segment;
    return;
  }

  if (!regex.test(`${pre}.${segment}.${post}`)) {
    return;
  }

  for (
    const inner of possibleCombinations(
      pre,
      segment.replace("?", "."),
      post,
      regex,
    )
  ) {
    yield inner;
  }

  for (
    const inner of possibleCombinations(
      pre,
      segment.replace("?", "#"),
      post,
      regex,
    )
  ) {
    yield inner;
  }

  return;
}

export function unfold(entries: Entry[], times: number) {
  return entries.map((entry) => unfoldEntry(entry, times));
}

function unfoldEntry(entry: Entry, times: number) {
  return {
    pattern: xTimesN(entry.pattern, times).join("?"),
    groups: xTimesN(entry.groups, times).flat(),
  };
}

export function solve(entries: Entry[]) {
  return sum(entries.map((entry, idx) => {
    console.log("Solving next", idx);
    return solveEntry(entry);
  }));
}

function solveEntry(entry: Entry) {
  const regex = groupsToRegexOptimized(entry.groups);
  // console.log(regex);
  return getNumberOfCombinationsOptimized(entry.pattern, regex);
}

interface HeadState {
  go: (char: string) => -1 | 0 | 1;
  numberOfParallelHeads: number;
}

class StateMachine {
  private states = new Array<HeadState>();

  private needBroken(char: string) {
    if (char === "#") return 1;
    return -1;
  }

  private mayBroken(char: string) {
    switch (char) {
      case "#":
        return 1;
      case ".":
        return 0;
      default:
        return -1;
    }
  }

  private needWorking(char: string) {
    if (char === ".") {
      return 1;
    }
    return -1;
  }

  private isDone(char: string) {
    if (char === ".") {
      return 0;
    }
    return -1;
  }

  constructor(groups: number[]) {
    this.states.push({ go: this.mayBroken, numberOfParallelHeads: 1 });
    for (let i = 0; i < groups.length - 1; i++) {
      this.states.push(
        ...xTimesN(this.needBroken, groups[i] - 1).map((fun): HeadState => ({
          go: fun,
          numberOfParallelHeads: 0,
        })),
        { go: this.needWorking, numberOfParallelHeads: 0 },
        { go: this.mayBroken, numberOfParallelHeads: 0 },
      );
    }
    this.states.push(
      ...xTimesN(this.needBroken, groups.at(-1)! - 1).map((fun): HeadState => ({
        go: fun,
        numberOfParallelHeads: 0,
      })),
      { go: this.isDone, numberOfParallelHeads: 0 },
    );
  }

  public getCombinations(pattern: string) {
    for (const char of pattern) {
      const charOptions = char === "?" ? [".", "#"] : [char];

      const walk = charOptions.map((char) => {
        return this.states.map((state, idx) => {
          return {
            from: idx,
            res: state.go(char),
            num: state.numberOfParallelHeads,
          };
        });
      });

      this.states.forEach(state => state.numberOfParallelHeads = 0);

      walk.forEach(option => {
        option.forEach(el => {
            if (el.res === 1) {
                this.states[el.from + 1].numberOfParallelHeads += el.num;
            } else if (el.res === 0) {
              this.states[el.from].numberOfParallelHeads += el.num;
            }
        })
      });
      // console.log("Heads:", this.states.map(s => s.numberOfParallelHeads));
    }
    return this.states.at(-1)!.numberOfParallelHeads;
  }
}

export function solveByStateMachine(entries: Entry[]) {
    return sum(entries.map(entry => {
        const stateMachine = new StateMachine(entry.groups);
        const numberOfCombinations = stateMachine.getCombinations(entry.pattern);
        return numberOfCombinations;
    }));
}