import { ArrayMinSize, Max, Min } from 'class-validator';
import { FLAG, LIMIT } from './constants';

const MIN = 5;

export class RangeDto {
  @Min(-LIMIT)
  @Max(-1)
  value: number = -MIN;
  negative: number = -5;
  positive: number = +5;
  enabled: boolean = !FLAG;
  @ArrayMinSize(-LIMIT)
  items: string[];

  constructor(
    public ctorDefault: number = -MIN,
    public ctorNegative: number = -2
  ) {}
}
