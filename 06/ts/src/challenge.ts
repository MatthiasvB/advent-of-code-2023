import fs from "node:fs";
import { parseChallenge, parseChallengePart2, solvePart1 } from "./utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: "utf-8" });

const parsedInput = parseChallenge(input);
const parsedInputPart2 = parseChallengePart2(input);

const resPart1 = solvePart1(parsedInput);
const resPart2 = solvePart1([parsedInputPart2]);

console.log("Part 1's result is", resPart1);
console.log("Part 2's result is", resPart2);
