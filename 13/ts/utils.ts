import { sum, transpose } from "../../utils.ts";

export class Landscape {
    constructor(private readonly landscape: string[]) {}

    private getLinesLeftOfReflection(landscape: string[]): number {
        return this.getLinesTopOfReflection(transpose(landscape.map(line => line.split(''))).map(col => col.join('')));
    }

    private getLinesTopOfReflection(landscape: string[]): number {
        for (let currentLine = 0; currentLine < landscape.length - 1; currentLine++) {
            let offset = 0;
            let found = false;
            while (!found) {
                if (currentLine - offset < 0 || currentLine + offset === landscape.length - 1) {
                    found = true;
                    break;
                } else if (landscape[currentLine - offset] === landscape[currentLine + offset + 1]) {
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

    public solve() {
        const topReflectionRes = this.getLinesTopOfReflection(this.landscape) * 100;
        const leftReflectionRes = this.getLinesLeftOfReflection(this.landscape);
        return topReflectionRes || leftReflectionRes;
    }
}

export function parseChallenge(input: string) {
    return input.trim().split('\n\n').map(landscape => new Landscape(landscape.split('\n')));
}

export function solve(parsedChallenge: Landscape[]) {
    return sum(parsedChallenge.map(landscape => landscape.solve()));
}