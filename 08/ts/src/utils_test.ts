import fs from "node:fs";
import path from "node:path";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { parseChallenge, solvePart2, solvePart2HeavilyOptimized, solvePart2SomewhatOptimized } from "./utils.ts";
import { challenge } from "./challenge_input.ts";
import { assert } from "node:console";

const exampleInput = `LR

11A = (11B, XXX)
11B = (XXX, 11Z)
11Z = (11B, XXX)
22A = (22B, XXX)
22B = (22C, 22C)
22C = (22Z, 22Z)
22Z = (22B, 22B)
XXX = (22C, 22C)`;

const exampleOutput = 6;

Deno.test("Advent of code 2023 challenge 5 part 2", async (t) => {

  // await t.step("solves the example challenge without optimization", () => {
  //   assertEquals(solvePart2(parseChallenge(exampleInput)), exampleOutput);
  // });

  // await t.step("solves the example challenge with some optimization", () => {
  //   assertEquals(solvePart2SomewhatOptimized(parseChallenge(exampleInput)), exampleOutput);
  // });

  // await t.step("solves the example challenge with heavy optimization", () => {
  //   assertEquals(solvePart2HeavilyOptimized(parseChallenge(exampleInput)), exampleOutput);
  // });

  await t.step("check alignment of naive and heavily optimized iteration", () => {
    const walker = parseChallenge(challenge);
    const [steps, optimizedResult] = walker.walkByJumpMap(1_600_000);
    assert(steps > 1_599_999);
    console.log(`Took ${steps} steps`);
    const [, naiveResults] = walker.walkFromAllAToAllZ(steps);
    console.log("Naive results    ", naiveResults);
    console.log("Optimized results", optimizedResult);
    assertEquals(optimizedResult, naiveResults);
  });
});
