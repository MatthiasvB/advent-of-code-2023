import {
  getLastNumber,
  lineSum,
  lineSumWithForwardBackwardSearch,
  multiLineSum,
  multiLineSumWithForwardBackwardSearch,
  numberStartsWith,
} from "./utils.ts";

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Advent of code 2023 challenge 1 part 2", async (t) => {

  await t.step("sums lines according to instructions", () => {
    const testString = "auacuh4aihc3cua45ej9aeiabk";
    const result = 49;

    assertEquals(lineSum(testString), result);
  });

  await t.step("sums lines according to instructions even if there is only one digit", () => {
    const testString = "auacuhaihccua5ejaeiabk";
    const result = 55;

    assertEquals(lineSum(testString), result);
  });

  await t.step("sums multiple lines according to instructions", () => {
    const testString = `asckackja8akbap84bak93
TAKCA4BAKC4BK9O
AEUAOE8UIocuap8a44`;
    const result = 83 + 49 + 84;

    assertEquals(multiLineSum(testString), result);
  });

  await t.step("numberStartsWidth", () => {
    assertEquals(numberStartsWith("eight"), true);

    assertEquals(numberStartsWith("eig"), true);

    assertEquals(numberStartsWith("e"), true);

    assertEquals(numberStartsWith("ee"), false);
  });

  await t.step("Tag 1 second example attempt 2", () => {
    const example = `two1nine
  eightwothree
  abcone2threexyz
  xtwone3four
  4nineeightseven2
  zoneight234
  7pqrstsixteen`;

    const result = 281;

    assertEquals(multiLineSumWithForwardBackwardSearch(example), result);
  });

  await t.step("krrk", () => {
    const examples = [
      ["two1nine", 9],
      ["eightwothree", 3],
      ["abcone2threexyz", 3],
      ["xtwone3four", 4],
      ["4nineeightseven2", 2],
      ["zoneight234", 4],
      ["7pqrstsixteen", 6],
      ["2threefour2fourrkkndqzq", 4],
    ] as const;

    examples.forEach(([str, res]) => {
      assertEquals(getLastNumber(str), res);
    });
  });

  await t.step("krrk2", () => {
    const examples = [
      ["qjnbpfrztwo1", 21],
      ["dlxhmzsbtthree5nine281eight", 38],
      ["hmzeightwo1775dssdqkxnfbcqrhfqfqfrrgone", 81],
      ["hmzeightwotwo1775dssdqkxnfbcqrhfqfqfrrgone", 81],
      ["8mvnhpvkddhtwonghtlpq", 82],
    ] as const;

    examples.forEach(([str, num]) => {
      assertEquals(lineSumWithForwardBackwardSearch(str), num);
    });
  });
});
