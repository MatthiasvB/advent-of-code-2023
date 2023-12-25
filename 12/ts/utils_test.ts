import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { getNumberOfCombinations, groupsToRegex } from "./utils.ts";

const exampleValidInputs = `.###.##.#...
.###.##..#..
.###.##...#.
.###.##....#
.###..##.#..
.###..##..#.
.###..##...#
.###...##.#.
.###...##..#
.###....##.#`.split("\n");

const exampleInValidInputs = `.###.##.#..#
.###.##..##.
.###.###..#.
.###.##.#..#
.###..##....
.####.##..#.
.###..##..##
.###.#.##.#.
.###...#####
.###....###.`.split("\n");

Deno.test("Day 12", async (t) => {
  await t.step("test valid regexs", () => {
    const regex = groupsToRegex([3, 2, 1]);
    for (const ex of exampleValidInputs) {
        assertEquals(regex.test(ex), true);
    }
  });

  await t.step("test invalid regexs", () => {
    const regex = groupsToRegex([3, 2, 1]);
    for (const ex of exampleInValidInputs) {
        assertEquals(regex.test(ex), false, `${ex} failed`);
    }
  });

  await t.step("single", () => {
    assertEquals(
      getNumberOfCombinations("?###????????", groupsToRegex([3, 2, 1])),
      10,
    );
  });
});
