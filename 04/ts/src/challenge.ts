import fs from "node:fs";
import {
getNumberOfPoints,
  parseChallenge,
} from "./utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: "utf-8" });

const parsedInput = parseChallenge(input);

const resPart1 = getNumberOfPoints(parsedInput);
// const resPart2 = getSumOfProductOfNumbersSurroundingSymbolIfOnlyXNumbers(/\*/, parsedInput, 2);

console.log("Part 1's result is", resPart1);
// console.log("Part 2's result is", resPart2);
