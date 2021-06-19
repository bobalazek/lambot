import chalk from 'chalk';

export async function asyncForEach<T>(array: Array<T>, callback: (item: T, index: number) => void) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index);
  }
}

export function colorTextPercentageByValue(value: number) {
  if (value > 0) {
    return chalk.green('+' + value.toPrecision(3) + '%');
  } else if (value < 0) {
    return chalk.red(value.toPrecision(3) + '%');
  }

  return value.toPrecision(3) + '%';
}

export function calculatePercentage(a: number, b: number) {
  return ((a - b) / b) * 100;
}
