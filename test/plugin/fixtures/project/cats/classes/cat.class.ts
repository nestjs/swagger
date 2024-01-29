import { LettersEnum } from '../dto/pagination-query.dto';

export class Cat {
  name: string;

  /**
   * The age of the Cat
   * @example 4
   */
  age: number;

  /**
   * The breed of the Cat
   */
  breed: string;

  tags?: string[];

  createdAt: Date;

  urls?: string[];

  options?: Record<string, any>[];

  enum: LettersEnum;

  enumArr: LettersEnum;

  uppercaseString: Uppercase<string>;
  
  lowercaseString: Lowercase<string>;

  capitalizeString: Capitalize<string>;

  uncapitalizeString: Uncapitalize<string>;
}
