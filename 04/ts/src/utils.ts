import { sum } from "../../../utils.ts";

const whiteSpace = /\s+/;
export function parseChallenge(input: string) {
  return input.split("\n").filter((l) => l.trim() !== "").map((line) => {
    const [haveNumbers, winningNumbers] = line.split(":")[1].split("|").map((
      section,
    ) => section.trim().split(whiteSpace).map((num) => +num));
    return { haveNumbers, winningNumbers };
  });
}

function getValueOfCard(
  card: { haveNumbers: number[]; winningNumbers: number[] },
) {
  // deduplication does not seem to be required
  //   const hN = [...new Set(card.haveNumbers)];
  const wN = new Set(card.winningNumbers);
  const numberOfWins = card.haveNumbers.filter((num) => wN.has(num)).length;
  const points = numberOfWins ? 2 ** (numberOfWins - 1) : 0;
//   debugPrintLine(card, numberOfWins, points);
  return points;
}

function getWinsOfCard(
    card: { haveNumbers: number[]; winningNumbers: number[] },
  ) {
    // deduplication does not seem to be required
    //   const hN = [...new Set(card.haveNumbers)];
    const wN = new Set(card.winningNumbers);
    const numberOfWins = card.haveNumbers.filter((num) => wN.has(num)).length;
    return numberOfWins;
  }

export function getNumberOfPoints(
  parsedInput: ReturnType<typeof parseChallenge>,
) {
  return sum(parsedInput.map(getValueOfCard));
}

let currentLine = 0;
function debugPrintLine(
  card: { haveNumbers: number[]; winningNumbers: number[] },
  wins: number,
  points: number,
  ...postfix: string[]
) {
  const out = [`${++currentLine}:  -  `];
  const formatCss = new Array<string>();
  const green = "color: green";
  const white = "color: white";
  const red = "color: red";
  const wH = new Set(card.haveNumbers);
  const wN = new Set(card.winningNumbers);

  for (const num of card.haveNumbers) {
    if (wN.has(num)) {
      out.push(`%c${num}%c, `);
      formatCss.push(green, white);
    } else {
      out.push(`${num}, `);
    }
  }

  out.push("| ");

  for (const num of card.winningNumbers) {
    if (wH.has(num)) {
      out.push(`%c${num}%c, `);
      formatCss.push(red, white);
    } else {
      out.push(`${num}, `);
    }
  }

  out.push(` -> ${wins} wins -> ${points} points`);
  console.log(out.join(""), ...formatCss, ...postfix);
}

export function getTotalNumberOfCards(parsedInput: ReturnType<typeof parseChallenge>) {
    const cardsWithMultipliers = parsedInput.map(card => ({
        cardValue: getWinsOfCard(card),
        copies: 1
    }));
    cardsWithMultipliers.forEach((card, index, cards) => {
        for (let idx = 1; idx <= card.cardValue && index + idx < cards.length; idx++) {
            cards[index + idx].copies += card.copies;
        }
    });

    for (let i = 0; i < parsedInput.length; i++) {
        debugPrintLine(parsedInput[i], cardsWithMultipliers[i].cardValue, NaN, ''+cardsWithMultipliers[i].copies);
    }

    return sum(cardsWithMultipliers.map(card => card.copies));
}
