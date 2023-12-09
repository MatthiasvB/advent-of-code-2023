import { sum } from "../../../utils.ts";

enum CardType {
  FiveOfAKind,
  FourOfAKind,
  FullHouse,
  ThreeOfAKind,
  TwoPair,
  Pair,
  HighCard,
}

export interface Hand {
  card: string;
  bid: number;
}

export function parseChallenge(input: string): Hand[] {
  return input.trim().split("\n").map((line) => {
    const [card, rawBid] = line.split(" ");
    return {
      card,
      bid: +rawBid,
    };
  });
}

function descendingSorter(a: number, b: number): number {
  return b - a;
}

function getHistogram(card: string) {
  const countMap = new Map<string, number>();
  for (const char of card) {
    countMap.set(char, (countMap.get(char) ?? 0) + 1);
  }
  return [...countMap.values()].sort(descendingSorter);
}

function getHistogramPart2(card: string) {
  const countMap = new Map<string, number>();
  let countJs = 0;
  for (const char of card) {
    if (char !== "J") {
      countMap.set(char, (countMap.get(char) ?? 0) + 1);
    } else {
      countJs++;
    }
  }
  const hist = [...countMap.values()].sort(descendingSorter);
  hist[0] = (hist[0] ?? 0) + countJs;
  return hist;
}

function isFiveOfAKind(histogram: number[]) {
  return histogram[0] === 5;
}

function isFourOfAKind(histogram: number[]) {
  return histogram[0] === 4;
}

function isFullHouse(histogram: number[]) {
  return histogram[0] === 3 && histogram[1] === 2;
}

function isThreeOfAKind(histogram: number[]) {
  return histogram[0] === 3;
}

function isTwoPair(histogram: number[]) {
  return histogram[0] === 2 && histogram[1] === 2;
}

function isPair(histogram: number[]) {
  return histogram[0] === 2;
}

function getCardType(card: string): CardType {
  const hist = getHistogram(card);
  if (isFiveOfAKind(hist)) {
    return CardType.FiveOfAKind;
  } else if (isFourOfAKind(hist)) {
    return CardType.FourOfAKind;
  } else if (isFullHouse(hist)) {
    return CardType.FullHouse;
  } else if (isThreeOfAKind(hist)) {
    return CardType.ThreeOfAKind;
  } else if (isTwoPair(hist)) {
    return CardType.TwoPair;
  } else if (isPair(hist)) {
    return CardType.Pair;
  } else {
    return CardType.HighCard;
  }
}

function getCardTypePart2(card: string): CardType {
  const hist = getHistogramPart2(card);
  if (isFiveOfAKind(hist)) {
    return CardType.FiveOfAKind;
  } else if (isFourOfAKind(hist)) {
    return CardType.FourOfAKind;
  } else if (isFullHouse(hist)) {
    return CardType.FullHouse;
  } else if (isThreeOfAKind(hist)) {
    return CardType.ThreeOfAKind;
  } else if (isTwoPair(hist)) {
    return CardType.TwoPair;
  } else if (isPair(hist)) {
    return CardType.Pair;
  } else {
    return CardType.HighCard;
  }
}

const stringByCardString: Record<string, string> = {
  T: "A",
  J: "B",
  Q: "C",
  K: "D",
  A: "E",
};

const stringByCardStringPart2: Record<string, string> = {
  T: "A",
  Q: "C",
  K: "D",
  A: "E",
  J: "1",
};

function getSortableCardString(card: string) {
  return card.split("").map((char) => stringByCardString[char] ?? char).join(
    "",
  );
}

function getSortableCardStringPart2(card: string) {
  return card.split("").map((char) => stringByCardStringPart2[char] ?? char)
    .join("");
}

const stringByCardType: Record<CardType, string> = {
  [CardType.HighCard]: "A",
  [CardType.Pair]: "B",
  [CardType.TwoPair]: "C",
  [CardType.ThreeOfAKind]: "D",
  [CardType.FullHouse]: "E",
  [CardType.FourOfAKind]: "F",
  [CardType.FiveOfAKind]: "G",
};

function mapCardToSortableString(card: string) {
  const cardType = getCardType(card);
  const sortableCardString = getSortableCardString(card);
  return `${stringByCardType[cardType]}-${sortableCardString}`;
}

function mapCardToSortableStringPart2(card: string) {
  const cardType = getCardTypePart2(card);
  const sortableCardString = getSortableCardStringPart2(card);
  return `${stringByCardType[cardType]}-${sortableCardString}`;
}

export function solve(input: ReturnType<typeof parseChallenge>) {
  return sum(
    input.map((hand) => ({
      ...hand,
      sortString: mapCardToSortableString(hand.card),
    })).sort((a, b) => {
      if (a.sortString > b.sortString) {
        return 1;
      } else if (a.card === b.card) {
        return 0;
      } else {
        return -1;
      }
    }).map((hand, idx) => hand.bid * (idx + 1)),
  );
}

export function solvePart2(input: ReturnType<typeof parseChallenge>) {
  return sum(
    input.map((hand) => ({
      ...hand,
      sortString: mapCardToSortableStringPart2(hand.card),
    })).sort((a, b) => {
      if (a.sortString > b.sortString) {
        return 1;
      } else if (a.card === b.card) {
        return 0;
      } else {
        return -1;
      }
    }).map((hand, idx) => { console.log(`${hand.sortString} (${hand.card}): ${hand.bid} -> ${hand.bid * (idx+1)}`); return hand.bid * (idx+1);}),
  );
}
