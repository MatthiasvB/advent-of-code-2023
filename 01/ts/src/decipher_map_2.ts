import fs from "node:fs";
import { multiLineSumWithForwardBackwardSearch } from "./utils.ts";

const fileName = Deno.args[0]; // first argument

const input: string = fs.readFileSync(fileName, { encoding: 'utf-8' });

const res = multiLineSumWithForwardBackwardSearch(input);

console.log("Result is", res);