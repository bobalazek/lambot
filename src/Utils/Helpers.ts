import chalk from 'chalk';

export async function asyncForEach<T>(array: Array<T>, callback: (item: T, index: number) => void) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index);
  }
}

export function colorTextPercentageByValue(value: number): string {
  if (value > 0) {
    return chalk.green('+' + value.toPrecision(3) + '%');
  } else if (value < 0) {
    return chalk.red(value.toPrecision(3) + '%');
  }

  return value.toPrecision(3) + '%';
}

export function calculatePercentage(a: number, b: number): number {
  return ((a - b) / b) * 100;
}

export function timeframeToSeconds(timeframe: string): number {
  const amount = parseInt(timeframe);
  const unit = timeframe.trim().replace('' + amount, '');

  switch (unit) {
    case 'ms':
    case 'millisecond':
    case 'milliseconds':
      return amount * 0.001;
    case 's':
    case 'second':
    case 'seconds':
      return amount;
    case 'm':
    case 'minute':
    case 'minutes':
      return amount * 60;
    case 'h':
    case 'hour':
    case 'hours':
      return amount * 3600;
    case 'd':
    case 'day':
    case 'days':
      return amount * 86400;
    case 'w':
    case 'week':
    case 'weeks':
      return amount * 604800;
    default:
      throw new Error('Invalid unit provided.');
  }
}

// https://stackoverflow.com/a/61281355
export function toPlainString(num: number) {
  return (''+ +num).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
    function(a,b,c,d,e) {
      return e < 0
        ? b + '0.' + Array(1-e-c.length).join('0') + c + d
        : b + c + d + Array(e-d.length+1).join('0');
    });
}
