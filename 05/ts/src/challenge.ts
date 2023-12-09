import fs from "node:fs";
import { getMinLocationPart2, getMinLocationPart2Optimized, mapAllToLocation, parseChallenge } from "./utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: "utf-8" });

const parsedInput = parseChallenge(input);

const resPart1 = Math.min(...mapAllToLocation(parsedInput));
const resPart2 = getMinLocationPart2(parsedInput);
// const resPart2 = getMinLocationPart2Optimized(parsedInput);

console.log("Part 1's result is", resPart1);
console.log("Part 2's result is", resPart2);
