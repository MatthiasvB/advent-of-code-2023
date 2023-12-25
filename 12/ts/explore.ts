import fs from "node:fs";

const fileName = Deno.args[0]; // first argument
console.log(`Reading ${fileName}`);

const input: string = fs.readFileSync(fileName, { encoding: "utf-8" });

const maxQuestionMarks = Math.max(...input.trim().split('\n').map(line => line.replace(/[^?]/g, '').length));

console.log("Maximum number of ?:", maxQuestionMarks);