const colors = ["red", "green", "blue"] as const;

export type Color = (typeof colors)[number];

export type GameSet = Partial<Record<Color, number>>;

export type Game = {
  id: number;
  sets: GameSet[];
};

export type Challenge = Record<Color, number>;

export function parseChallenge(input: string): Game[] {
  return input.split("\n").filter((l) => l.trim() !== "").map((line) => {
    const [name, sets] = line.split(":");
    const id = +name.split(" ")[1];
    // set -> entry -> [number, color]
    const setList: [string, string][][] = sets.split(";").map((set) =>
      set.split(",").map((entry) => entry.trim().split(" ") as [string, string])
    );

    return {
      id,
      sets: setList.map((set) =>
        set.reduce(
          (acc, entry) => ({ ...acc, [entry[1]]: +entry[0] }),
          {} as GameSet,
        )
      ),
    };
  });
}

function setFulfillsChallenge(
  gameSet: GameSet,
  challenge: Challenge,
): boolean {
  return colors.every((color) => challenge[color] >= (gameSet[color] ?? 0));
}

function gameFulfillsChallenge(
  game: Game,
  challenge: Challenge,
): boolean {
  return game.sets.every((gameSet) => setFulfillsChallenge(gameSet, challenge));
}

export function getIdsOfValidGames(
  games: Game[],
  challenge: Challenge,
): number[] {
  return games.filter((game) => gameFulfillsChallenge(game, challenge)).map(
    (validGame) => validGame.id,
  );
}

function minCubesPerGame(game: Game) {
  return colors.map((color) =>
    game.sets.reduce(
      (acc, curr) => ({ [color]: Math.max(acc[color] ?? 0, curr[color] ?? 0) }),
      { [color]: 0 },
    )
  ).reduce((prev, colorSet) => ({ ...prev, ...colorSet }));
}

function powerOfGame(game: Game): number {
  return Object.values(minCubesPerGame(game)).reduce((a, b) => a * b);
}

export function sumOfPowerOfGames(games: Game[]): number {
  return games.map((game) => powerOfGame(game)).reduce((prev, power) =>
    prev + power
  );
}
