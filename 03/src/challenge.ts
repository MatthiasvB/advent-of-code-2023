import fs from "node:fs";
import {
  debugPrintChallenge,
  getAdjacentIndices,
  getNumbersWithPositions,
  getSymbolAdjacentNumbers,
  parseChallenge,
} from "./utils.ts";
import { sum } from "../../utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: "utf-8" });

const parsedInput = parseChallenge(input);
const numbersWithPositions = getNumbersWithPositions(parsedInput);
const adjacencyIndices = getAdjacentIndices(parsedInput);
const symbolAdjacentNumbers = getSymbolAdjacentNumbers(
  numbersWithPositions,
  adjacencyIndices,
);

console.log("Adjacency map:\n", numbersWithPositions);
debugPrintChallenge(parsedInput, adjacencyIndices);

const resPart1 = sum(symbolAdjacentNumbers);
// const resPart2 = sumOfPowerOfGames(parsedInput);

console.log("Part 1's result is", resPart1);
// console.log("Part 2's result is", resPart2);
