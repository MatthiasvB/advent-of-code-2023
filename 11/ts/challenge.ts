import fs from "node:fs";
import { parseChallenge, solve, solvePart2 } from "./utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: "utf-8" });

const parsedInput = parseChallenge(input);

const resPart1 = solve(parsedInput);
const resPart2 = solvePart2(parsedInput);

console.log("Part 1's result is", resPart1);
console.log("Part 2's result is", resPart2);
