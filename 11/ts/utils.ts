import { transpose } from "../../utils.ts";

interface Location {
    x: number,
    y: number
}

export function parseChallenge(input: string) {
    return input.trim().split('\n');
}

function expandRows(grid: string[]) {
    return grid.flatMap(row => row.includes('#') ? [row] : [row, row])
}

function expandColumns(grid: string[]) {
    return transpose(grid.map(row => row.split(''))).flatMap(col => col.includes('#') ? [col] : [col, col])
}

function getLocations(grid: string[][]) {
    const locations = new Array<Location>();

    for (const [colIndex, col] of grid.entries()) {
        for (const [rowIndex, el] of col.entries()) {
            if (el === "#") {
                locations.push({ x: colIndex, y: rowIndex });
            }
        }
    }

    return locations;
}

function getDistance(l1: Location, l2: Location) {
    return Math.abs(l1.x - l2.x) + Math.abs(l1.y - l2.y);
}

function getSumOfDistances(locations: Location[]) {
    let distanceSum = 0;

    for (let currentIdx = 0; currentIdx < locations.length; currentIdx++) {
        for (let innerIdx = currentIdx + 1; innerIdx < locations.length; innerIdx++) {
            distanceSum += getDistance(locations[currentIdx], locations[innerIdx]);
        }
    }

    return distanceSum;
}

function getEffectiveIndices(grid: string[] | string[][]) {
    const indices = new Array<number>();

    for (const col of grid) {
        const lastIndexWithFallback = indices[indices.length - 1] ?? 0;
        if (col.includes('#')) {
            indices.push(lastIndexWithFallback + 1);
        } else {
            indices.push(lastIndexWithFallback + 1e6);
        }
    }

    return indices;
}

export function solve(grid: string[]) {
    return getSumOfDistances(getLocations(expandColumns(expandRows(grid))));
}

export function solvePart2(grid: string[]) {
    const rowIndices = getEffectiveIndices(grid);
    const transposedGrid = transpose(grid.map(row => row.split('')));
    const colIndices = getEffectiveIndices(transposedGrid);

    const locations = getLocations(transposedGrid);
    const expandedLocations = locations.map(loc => ({ x: colIndices[loc.x], y: rowIndices[loc.y] }));
    return getSumOfDistances(expandedLocations);
}