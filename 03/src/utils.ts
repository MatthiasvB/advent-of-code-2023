export type PositionMarker = `${string}-${string}`;

export function parseChallenge(input: string) {
  return input.split("\n").map((line) => line.split(""));
}

const symbol = /^[^0-9\.]$/;
export function getAdjacentIndices(characterGrid: string[][]) {
  const symbolAdjacentPositions = new Set<`${string}-${string}`>();
  characterGrid.forEach((line, lineIndex) => {
    line.forEach((character, characterIndex) => {
      if (symbol.test(character)) {
        getSurroundingIndicesFormatted(characterIndex, lineIndex).forEach((i) =>
          symbolAdjacentPositions.add(i)
        );
      }
    });
  });
  return symbolAdjacentPositions;
}

function mapToPosition(x: number, y: number): PositionMarker {
  return `${x}-${y}`;
}

function getSurroundingIndicesFormatted(x: number, y: number) {
  return getSurroundingIndices(x, y).map(([x, y]) => mapToPosition(x, y));
}

function getSurroundingIndices(x: number, y: number) {
  // deno-fmt-ignore
  return [
        [x-1, y-1], [x, y-1], [x+1, y-1],
        [x-1, y  ],           [x+1, y  ],
        [x-1, y+1], [x, y+1], [x+1, y+1]
    ];
}

const numberMatcher = /^[0-9]$/;
export function getNumbersWithPositions(characterGrid: string[][]) {
  const numberMap = new Array<[number, PositionMarker[]]>();
  let numberBuilder = "";
  let indexBuilder = new Array<PositionMarker>();
  characterGrid.forEach((line, lineIndex) => {
    line.forEach((character, characterIndex) => {
      if (numberMatcher.test(character)) {
        numberBuilder += character;
        indexBuilder.push(mapToPosition(characterIndex, lineIndex));
      } else {
        if (numberBuilder) {
          numberMap.push([+numberBuilder, indexBuilder]);
          numberBuilder = "";
          indexBuilder = [];
        }
      }
    });
  });
  return numberMap;
}

export function getSymbolAdjacentNumbers(
  numbersWithPositions: Array<[number, PositionMarker[]]>,
  adjacencySet: Set<PositionMarker>,
) {
  return numbersWithPositions.filter(([_, positions]) =>
    positions.some((pos) => {
        console.log("Checking for", pos);
        return adjacencySet.has(pos)
    })
  ).map(([value]) => value);
}

export function debugPrintChallenge(
  input: string[][],
  adjacencySet: Set<PositionMarker>,
) {
  const outChars = new Array<string>();
  const redCSS = "color: red";
  const whiteCSS = "color: white";
  const greenCSS = "color: green";
  const cssModifier = new Array<string>();
  input.forEach((line, lineIndex) => {
    line.forEach((char, charIndex) => {
      if (symbol.test(char)) {
        if (char === "%") char = "X";
        outChars.push("%c", char, "%c");
        cssModifier.push(greenCSS, whiteCSS);
      } 
      else if (adjacencySet.has(mapToPosition(charIndex, lineIndex))) {
        outChars.push("%c", char, "%c");
        cssModifier.push(redCSS, whiteCSS);
      } 
      else {
        outChars.push(char);
      }
    });
    outChars.push("\n");
  });
  console.log(outChars.join(""), ...cssModifier);
}
