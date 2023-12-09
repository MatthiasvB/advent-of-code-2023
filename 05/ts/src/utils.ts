export type Range = {
    start: number;
    length: number;
}

function isInRange(range: Range, point: number) {
    return range.start <= point && range.start + range.length > point;
}

function getSplitPoints(range: Range, potentialSplitPoints: number[]) {
    return potentialSplitPoints.filter(splitPoint => isInRange(range, splitPoint));
}

function deduplicateAndSort(numbers: number[]) {
    return [...new Set(numbers).values()].sort((a, b) => a-b);
}

function splitRange(range: Range, splitPoints: number[]): Range[] {
    const allPoints = deduplicateAndSort([range.start, ...splitPoints, range.start + range.length]);
    const ranges: Range[] = allPoints.map((point, idx, points) => {
        return {
            start: point,
            length: (points[idx+1] ?? 0)-point
        }
    }).filter(range => range.length >= 0);
    return ranges;
}

export class Mapper {
    // dest source length
    private readonly sortedMappings: [number, number, number][]
  constructor(
    private readonly source: string,
    private readonly destination: string,
    mappings: [number, number, number][],
  ) {
    this.sortedMappings = mappings.sort((a, b) => a[1] - b[1]);
  }

  public getDestination() { return this.destination }

  public getSource() { return this.source }

  public map(id: number) {
    for (const mapping of this.sortedMappings) {
        if (mapping[1] <= id && mapping[1] + mapping[2] > id) {
            return mapping[0] + (id - mapping[1]);
        }
    }
    return id;
  }

  public bracketMap(ranges: Range[]): Range[] {

    const breakPoints = deduplicateAndSort(this.sortedMappings.flatMap(mapping => [mapping[1], mapping[1] + mapping[2]]));

    return ranges.flatMap(range => {
        const splitPoints = getSplitPoints(range, breakPoints);

        const splitRanges = splitRange(range, splitPoints);

        return splitRanges.map(range => {
            range.start = this.map(range.start);
            return range;
        });
    });
  } 
}

export class MetaMapper {
    private readonly bySource = new Map<string, Mapper>();

    constructor(mappers: Mapper[]) {
        mappers.forEach(mapper => this.bySource.set(mapper.getSource(), mapper));
    }

    public mapFromTo(source: string, destination: string, id: number) {
        let current = source;
        while (current != destination) {
            const mapper = this.bySource.get(current);
            if (!mapper) {
                throw new Error(`Could not find mapper for source ${current}`);
            }
            id = mapper.map(id);
            current = mapper.getDestination();
        }
        return id;
    }

    public mapFromToRange(source: string, destination: string, ranges: Range[]) {
        let current = source;
        while (current != destination) {
            const mapper = this.bySource.get(current);
            if (!mapper) {
                throw new Error(`Could not find mapper for source ${current}`);
            }
            ranges = mapper.bracketMap(ranges);
            current = mapper.getDestination();
        }
        return ranges;
    }
}

export function parseChallenge(input: string) {
    const [rawSeeds, ...rawMappings] = input.trim().split('\n\n');

    const seeds = rawSeeds.split(': ')[1].trim().split(' ').map(seed => +seed);

    const mappers = rawMappings.map(rawMapping => {
        const [idLine, ...mappings] = rawMapping.split('\n');

        const [source, destination] = idLine.split(' ')[0].split('-to-');

        const mapper = new Mapper(source, destination, mappings.map(mapping => mapping.split(' ').map(id => +id) as [number, number, number]))

        return mapper;
    });

    return {
        seeds,
        mapper: new MetaMapper(mappers)
    };
}

export function mapAllToLocation(parsedInput: ReturnType<typeof parseChallenge>) {
    return parsedInput.seeds.map(seed => parsedInput.mapper.mapFromTo('seed', 'location', seed));
}

// Takes very long (~20min)
export function getMinLocationPart2(parsedInput: ReturnType<typeof parseChallenge>) {
    let min = Infinity;
    for (let idx = 0; idx < parsedInput.seeds.length; idx = idx + 2) {
        const rangeLength = parsedInput.seeds[idx+1];
        for (let i = 0; i < rangeLength; i++) {
            const location = parsedInput.mapper.mapFromTo('seed', 'location', parsedInput.seeds[idx] + i);
            if (location < min) min = location;
        }
    }
    if (min === Infinity) {
        throw new Error("Something must have gone wrong. Got infinity as smallest location.");
    }
    return min;
}

// This is instant :)
export function getMinLocationPart2Optimized(parsedInput: ReturnType<typeof parseChallenge>) {
    const ranges = new Array<Range>();
    for (let i = 0; i < parsedInput.seeds.length; i = i+2) {
        ranges.push({
            start: parsedInput.seeds[i],
            length: parsedInput.seeds[i+1]
        });
    }
    const mappedRanges = parsedInput.mapper.mapFromToRange('seed', 'location', ranges);
    return Math.min(...mappedRanges.map(range => range.start));
}