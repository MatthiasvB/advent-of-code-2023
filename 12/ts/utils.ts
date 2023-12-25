import { sum, xTimesN } from "../../utils.ts";

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

export function getNumberOfCombinations(input: string, regex: RegExp) {
    return x(input, (arg: string) => regex.test(arg));
}

function x(input: string, cb: (arg: string) => boolean): number {
    if (input.includes('?')) {
        const options = [input.replace('?', '.'), input.replace('?', '#')]
        return sum(options.map(option => x(option, cb)))
    }
    return cb(input) ? 1 : 0;
}

interface Entry {
    pattern: string;
    groups: number[];
}

export function parseChallenge(input: string) {
    return input.trim().split('\n').map((line): Entry => {
        const [pattern, groups] = line.split(' ');
        const parsedGroups = groups.split(',').map(group => +group);
        return {
            pattern,
            groups: parsedGroups
        };
    })
}

export function solve(entries: Entry[]) {
    return sum(entries.map(entry => {
        const regex = groupsToRegex(entry.groups);
        return getNumberOfCombinations(entry.pattern, regex);
    }));
}