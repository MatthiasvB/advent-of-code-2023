export interface Race {
    time: number;
    distance: number;
}

function middleOfTheNightFormula(a: number, b: number, c: number): [number, number] {
    // implements only green path
    const sqrtVal = Math.sqrt(b**2 - 4*a*c);
    return [(-b + sqrtVal) / (2*a), (-b - sqrtVal) / (2*a)].sort((a, b) => a-b) as [number, number];
}

function getNumberOfWinningCombinations(race: Race) {
    // dist < (total - hold) * hold
    // dist < total*hold - hold**2
    // 0 < -hold**2 + total*hold - dist
    // hold_equal_12 = (dist +- sqrt(total**2 + 4*dist) / 2
    const [eq1, eq2] = middleOfTheNightFormula(-1, race.time, -race.distance);
    return Math.floor(eq2 - eq1 - 1e-9);
}

export function parseChallenge(input: string) {
    const [rawTimes, rawDistances] = input.trim().split('\n');
    const times = rawTimes.split(/\s+/).slice(1).map(t => +t);
    const distances = rawDistances.split(/\s+/).slice(1).map(d => +d);

    const races = new Array<Race>();
    for (let idx = 0; idx < times.length; idx++) {
        races.push({
            time: times[idx],
            distance: distances[idx]
        });
    }
    return races;
}

export function parseChallengePart2(input: string): Race {
    const [rawTimes, rawDistances] = input.trim().split('\n');
    const time = +rawTimes.split(':')[1].replace(/ /g, '');
    const distance = +rawDistances.split(':')[1].replace(/ /g, '');

    return {
        time,
        distance
    };
}

export function solvePart1(races: Race[]) {
    return races.map(race => getNumberOfWinningCombinations(race)).reduce((a, b) => a * b, 1);
}