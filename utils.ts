export function sum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

export function faktor(numbers: number[]): number {
  return numbers.reduce((a, b) => a * b, 1);
}

export function transpose<T>(matrix: T[][]) {
  const newMatrix = new Array<T[]>();
  let current = [];
  for (let colIndex = 0; colIndex < matrix[0].length; colIndex++) {
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      current.push(matrix[rowIndex][colIndex]);
    }
    newMatrix.push(current);
    current = [];
  }
  return newMatrix;
}

export function xTimesN<T>(x: T, n: number): T[] {
  const arr = new Array<T>();
  for (let i = 0; i < n; i++) {
    arr.push(x);
  }
  return arr;
}