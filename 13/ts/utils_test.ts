import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { Landscape } from "./utils.ts";

const verticalExample = new Landscape(`#.##..##.
..#.##.#.
##......#
##......#
..#.##.#.
..##..##.
#.#.##.#.`.split("\n"));

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

Deno.test("Day 13", async (t) => {
  await t.step("test solution part 1", () => {
    assertEquals(verticalExample.solve(), 5);
  });
});
