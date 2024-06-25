import fs from "node:fs";
import { magicSolvePart2, parseChallenge, solvePart2HeavilyOptimized } from "./utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: "utf-8" });

const parsedInput = parseChallenge(input);

// const resPart1 = solve(parsedInput);
const resPart2 = solvePart2HeavilyOptimized(parsedInput);
// const resMagic = magicSolvePart2(parsedInput)

// console.log("Part 1's result is", resPart1);
console.log("Part 2's result is", resPart2);
// console.log("Part 2's result is", resMagic);

