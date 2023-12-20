import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { transpose } from "./utils.ts";

Deno.test("Advent of code 2023 day 10 part 1", async t => {
    await t.step("should transpose a matrix", () => {
        assertEquals(transpose([[1, 2], [3, 4]]), [[1, 3], [2, 4]]);
    });
})