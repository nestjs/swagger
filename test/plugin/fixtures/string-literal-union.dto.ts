export const stringLiteralUnionDtoText = `
type Color = "red" | "green" | "blue";
type StatusCode = 200 | 400 | 500;

export class StringLiteralUnionDto {
  @ApiProperty()
  color: Color;
  @ApiProperty()
  optionalColor?: Color;
  @ApiProperty()
  nullableColor: Color | null;
  @ApiProperty()
  inlineUnion: "active" | "inactive";
  @ApiProperty()
  nullableInlineUnion: "active" | "inactive" | null;
  @ApiProperty()
  statusCode: StatusCode;
  @ApiProperty()
  inlineNumberUnion: 1 | 2 | 3;
}
`;
