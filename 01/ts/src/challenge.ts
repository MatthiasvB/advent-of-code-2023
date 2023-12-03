import fs from "node:fs";
import { multiLineSum, multiLineSumWithForwardBackwardSearch } from "./utils.ts";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input = fs.readFileSync(fileName, { encoding: 'utf-8' });

const resPart1 = multiLineSum(input);
const resPart2 = multiLineSumWithForwardBackwardSearch(input);


console.log("Part 1's result is", resPart1);
console.log("Part 2's result is", resPart2);