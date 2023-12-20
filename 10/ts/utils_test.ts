import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { parseChallenge, solvePart2, transpose } from "./utils.ts";

const part2TestInput1 = `
...........
.S-------7.
.|F-----7|.
.||.....||.
.||.....||.
.|L-7.F-J|.
.|..|.|..|.
.L--J.L--J.
...........`;

const part2TestOutput1 = 4;

const part2TestInput2 = `
.F----7F7F7F7F-7....
.|F--7||||||||FJ....
.||.FJ||||||||L7....
FJL7L7LJLJ||LJ.L-7..
L--J.L7...LJS7F-7L7.
....F-J..F7FJ|L7L7L7
....L7.F7||L7|.L7L7|
.....|FJLJ|FJ|F7|.LJ
....FJL-7.||.||||...
....L---J.LJ.LJLJ...`;

const part2TestOutput2 = 8;

const part2TestInput3 = `
FF7FSF7F7F7F7F7F---7
L|LJ||||||||||||F--J
FL-7LJLJ||||||LJL-77
F--JF--7||LJLJ7F7FJ-
L---JF-JLJ.||-FJLJJ7
|F|F-JF---7F7-L7L|7|
|FFJF7L7F-JF7|JL---7
7-L-JL7||F7|L7F-7F7|
L.L7LFJ|||||FJL7||LJ
L7JLJL-JLJLJL--JLJ.L`;

const part2TestOutput3 = 10;

Deno.test("Advent of code 2023 day 10 part 1", async t => {
    // await t.step("should transpose a matrix", () => {
    //     assertEquals(transpose([[1, 2], [3, 4], [5, 6]]), [[1, 3, 5], [2, 4, 6]]);
    // });

    // await t.step("should solve the example challenge for part 2", () => {
    //     assertEquals(solvePart2(parseChallenge(part2TestInput1)), part2TestOutput1);
    // });

    await t.step("should solve the harder example challenge for part 2", () => {
        assertEquals(solvePart2(parseChallenge(part2TestInput2)), part2TestOutput2);
    });

    // await t.step("should solve the even harder example challenge for part 2", () => {
    //     assertEquals(solvePart2(parseChallenge(part2TestInput3)), part2TestOutput3);
    // });
})