import { faktor, sum, xTimesN } from "../../utils.ts";

// function reduceInvariable(str: string, groups: number[]) {

//     do {
//         const [newStr, newGroups]
//     }
// }

// function reduceInvariableIteration(str: string, groups: number[]) {
//     let newStr = str;
//     const newGroups = new Array<number>();
//     for (const groupSize of groups) {
//         newStr = str.replace(new RegExp(`[.?]#{${groupSize}[.?]}`), '');
//         if (newStr = str) {
//             newGroups.push(groupSize);
//         }
//     }
//     return [newStr, newGroups];
// }

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

export function getNumberOfCombinations(input: string, regex: RegExp) {
  return x(input, (arg: string) => regex.test(arg));
}

export function getNumberOfCombinationsOptimized(input: string, regex: RegExp) {
  const segmentedInput = input.split(/\.+/).filter(el => el.length > 0);
//   console.log(`Working on: ${segmentedInput.join('.')}`)
console.log(`Regex is ${regex}`);
console.log(`Input is ${segmentedInput.join(".")}`);
const res = faktor(segmentedInput.map((_, idx) => solutionsBySegment(segmentedInput, idx, x => regex.test(x))).map(x => {
    console.log(x);
    return x;
}));
console.log(`Result is ${res}`);
  return res;
}

function solutionsBySegment(segmentedInput: string[], currentSegment: number, cb: (arg: string) => boolean) {
    const pre = segmentedInput.slice(0, currentSegment).join('.');
    const post = segmentedInput.slice(currentSegment + 1).join('.');
    const segment = segmentedInput[currentSegment];

    return xBetterOptimized(pre, segment, post, cb);
}

function xBetterOptimized(pre: string, segment: string, post: string, cb: (arg: string) => boolean, d = 0): number {
    const inset = xTimesN('\t', d).join('|');
    console.log(`${inset}Testing ${pre + "!" + segment + "!" + post}`);
    if (!cb(pre + "." + segment + "." + post)) {
        console.log(inset + "Not matching");
        return 0;
    }

    if (segment.includes("?")) {
        const temp = [
            xBetterOptimized(pre, segment.replace("?", "."), post, cb, d + 1),
            xBetterOptimized(pre, segment.replace("?", "#"), post, cb, d + 1)
        ];
        console.log(`${inset} intermediate: ${temp}`);
        const res = sum(temp);
        console.log(`${inset}Got ${res}`);
        return res;
    }

    console.log(inset + "Matched!");
    return 1;
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

export function solvePart2(entries: Entry[]) {
  return sum(entries.map((entry) => {
    const timesTwo = unfoldEntry(entry, 2);
    const timesThree = unfoldEntry(entry, 3);
    const twoSolution = solveEntry(timesTwo);
    const threeSolution = solveEntry(timesThree);
    const fiveSolutionMaybe = ((threeSolution / twoSolution) % 1 === 0)
      ? twoSolution * (threeSolution / twoSolution) ** 3
      : solveEntry(unfoldEntry(entry, 5));
    console.log("Found part solution:", fiveSolutionMaybe);
    return fiveSolutionMaybe;
  }));
}
