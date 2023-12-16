import { sum } from "../../../utils.ts";

export function parseChallenge(input: string) {
  return input
    .trim()
    .split("\n")
    .map((line) =>
      line.split(/\s+/)
        .map((num) => +num)
    );
}

function getDerivatives(sequence: number[]) {
  let current = sequence;
  const derivates = new Array<number[]>();
  while (current.some((el) => el !== 0)) {
    derivates.push(current);
    const next = [];
    for (let i = 0; i < current.length - 1; i++) {
      next.push(current[i + 1] - current[i]);
    }
    current = next;
  }
  return derivates;
}

function extrapolate(derivatives: number[][]) {
  for (let i = derivatives.length - 2; i >= 0; i--) {
    const higherDerivative = derivatives[i + 1];
    derivatives[i].push(
      derivatives[i].at(-1)! + (higherDerivative.at(-1) ?? 0),
    );
  }
  return derivatives;
}

export function solve(parsedInput: number[][]) {
  return sum(
    parsedInput
      .map(getDerivatives)
      .map(extrapolate)
      .map((list) => list[0].at(-1)!),
  );
}
