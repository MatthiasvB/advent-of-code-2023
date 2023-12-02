const firstAndLastNumberMatcher = /^.*?([0-9]).*([0-9]).*?$/;
const onlyOneNumberMatcher = /^.*([0-9]).*$/;

const stringToNumberReplacements: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

export function getFirstNumber(line: string): number {
  let temp = "";
  for (const character of line) {
    if (isLiteralNumber(character)) {
      return +character;
    } else {
      temp += character;
      if (isSpelledOutNumber(temp)) {
        return stringToNumberReplacements[temp];
      } else {
        while (!numberStartsWith(temp)) {
          temp = temp.substring(1);
        }
      }
    }
  }
  console.warn(`Did not find a number in "${line}"`);
  return 0;
}

export function getLastNumber(line: string): number {
  let temp = "";
  for (const character of line.split("").toReversed().join("")) {
    if (isLiteralNumber(character)) {
      return +character;
    } else {
      temp = character + temp;
      if (isSpelledOutNumber(temp)) {
        return stringToNumberReplacements[temp];
      } else {
        while (!numberEndsWith(temp)) {
          temp = temp.substring(0, temp.length - 1);
        }
      }
    }
  }
  console.warn(`Did not find a number in "${line}"`);
  return 0;
}

export function numberStartsWith(candidate: string) {
  return Object.keys(stringToNumberReplacements).some((k) =>
    k.startsWith(candidate)
  );
}

export function numberEndsWith(candidate: string) {
  return Object.keys(stringToNumberReplacements).some((k) =>
    k.endsWith(candidate)
  );
}

function isSpelledOutNumber(str: string) {
  return Object.keys(stringToNumberReplacements).some((word) => word === str);
}

function isLiteralNumber(character: string) {
  return /^[0-9]$/.test(character);
}

export function lineSum(line: string) {
  if (firstAndLastNumberMatcher.test(line)) {
    const matches = firstAndLastNumberMatcher.exec(line);
    if (matches) {
      const first = matches[1];
      const last = matches[2];
      return +(first + last);
    }
    return 0; // does not happen
  } else if (onlyOneNumberMatcher.test(line)) {
    const matches = onlyOneNumberMatcher.exec(line);
    if (matches) {
      const first = matches[1];
      return +(first + first);
    }
    return 0; // does not happen
  } else {
    // TODO error
    console.warn("Could not find numbers in", line);
    return 0;
  }
}

export function lineSumWithForwardBackwardSearch(line: string) {
  const first = getFirstNumber(line);
  const last = getLastNumber(line);
  return +`${first}${last}`;
}

export function multiLineSum(input: string) {
  return input.split("\n").filter((l) => l !== "").map(lineSum).reduce((a, b) =>
    a + b
  );
}

export function multiLineSumWithForwardBackwardSearch(input: string) {
  return input.split("\n").filter((l) => l.trim() !== "").map(
    lineSumWithForwardBackwardSearch,
  ).reduce((
    a,
    b,
  ) => a + b);
}
