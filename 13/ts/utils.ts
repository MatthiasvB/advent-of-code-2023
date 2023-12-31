import { sum, transpose } from "../../utils.ts";

export class Landscape {
  constructor(private readonly landscape: string[]) {}

  private getLinesLeftOfReflection(
    landscape: string[],
    requiredDiff = 0,
  ): number {
    return this.getLinesTopOfReflection(
      transpose(landscape.map((line) => line.split(""))).map((col) =>
        col.join("")
      ),
      requiredDiff,
    );
  }

  private getLinesTopOfReflection(
    landscape: string[],
    requiredDiff = 0,
  ): number {
    for (
      let currentLine = 0;
      currentLine < landscape.length - 1;
      currentLine++
    ) {
      let offset = 0;
      let found = false;
      let diff = 0;
      while (!found) {
        if (
          diff === requiredDiff &&
          (currentLine - offset < 0 ||
            currentLine + offset === landscape.length - 1)
        ) {
          found = true;
          break;
        } else if (
          diff !== requiredDiff &&
          (currentLine - offset < 0 ||
            currentLine + offset === landscape.length - 1)
        ) {
          break;
        }

        diff += this.getLineDiff(
          landscape[currentLine - offset],
          landscape[currentLine + offset + 1],
        );

        if (diff <= requiredDiff) {
          offset++;
        } else {
          break;
        }
      }
      if (found) {
        return currentLine + 1;
      }
    }
    return 0;
  }

  private getLineDiff(lineA: string, lineB: string) {
    if (lineA.length !== lineB.length) {
      throw new Error(
        "Trying to compare lines of different lengths is not allowed",
      );
    }
    let diff = 0;
    for (let i = 0; i < lineA.length; i++) {
      if (lineA[i] !== lineB[i]) diff++;
    }
    return diff;
  }

  public solve(requiredDiff = 0) {
    const topReflectionRes =
      this.getLinesTopOfReflection(this.landscape, requiredDiff) * 100;
    const leftReflectionRes = this.getLinesLeftOfReflection(
      this.landscape,
      requiredDiff,
    );
    return topReflectionRes || leftReflectionRes;
  }
}

export function parseChallenge(input: string) {
  return input.trim().split("\n\n").map((landscape) =>
    new Landscape(landscape.split("\n"))
  );
}

export function solve(parsedChallenge: Landscape[]) {
  return sum(parsedChallenge.map((landscape) => landscape.solve()));
}

export function solvePart2(parsedChallenge: Landscape[]) {
  return sum(parsedChallenge.map((landscape) => landscape.solve(1)));
}
