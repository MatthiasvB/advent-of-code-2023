import fs from "node:fs";
import { Challenge, getIdsOfValidGames, parseChallenge, sumOfPowerOfGames } from "./utils.ts";
import { sum } from "../../utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: 'utf-8' });

const parsedInput = parseChallenge(input);

const challenge: Challenge = {
    red: 12,
    green: 13,
    blue: 14
}

const resPart1 = sum(getIdsOfValidGames(parsedInput, challenge));
const resPart2 = sumOfPowerOfGames(parsedInput);


console.log("Part 1's result is", resPart1);
console.log("Part 2's result is", resPart2);