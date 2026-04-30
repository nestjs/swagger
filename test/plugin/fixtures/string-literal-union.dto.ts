export const stringLiteralUnionDtoText = `
type Color = "red" | "green" | "blue";

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
}
`;
