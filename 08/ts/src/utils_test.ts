import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { parseChallenge, solvePart2, solvePart2HeavilyOptimized, solvePart2SomewhatOptimized } from "./utils.ts";

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

  await t.step("solves the example challenge without optimization", () => {
    assertEquals(solvePart2(parseChallenge(exampleInput)), exampleOutput);
  });

  await t.step("solves the example challenge with some optimization", () => {
    assertEquals(solvePart2SomewhatOptimized(parseChallenge(exampleInput)), exampleOutput);
  });

  await t.step("solves the example challenge with heavy optimization", () => {
    assertEquals(solvePart2HeavilyOptimized(parseChallenge(exampleInput)), exampleOutput);
  });
});
