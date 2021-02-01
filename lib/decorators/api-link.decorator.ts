import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export interface ApiLinkOptions {
  from: Type<unknown> | Function;
  /**
   * Field in the type `from` which is used as a parameter in the decorated route
   *
   * @default 'id'
   */
  fromField?: string;
  /**
   * Name of the parameter in the decorated route
   */
  routeParam: string;
}

/**
 * Defines this route as a link between two types
 *
 * Typically used when the link between the types is not present in the `from` type,
 * eg with the following
 *
 * ```typescript
 * class User {
 *   @ApiProperty()
 *   id: string
 *
 *   // no field documentIds: string[]
 * }
 *
 * class Document {
 *   @ApiProperty()
 *   id: string
 * }
 *
 * @Controller()
 * class UserController {
 *   @Get(':userId/documents')
 *   @ApiLink({from: User, fromField: 'id', routeParam: 'userId'})
 *   getDocuments(@Param('userId') userId: string)): Promise<Documents[]>
 * }
 * ```
 *
 * @param type The type for which the decorated function is the default getter
 * @param parameter Name of the parameter in the route of the getter which corresponds to the id of the type
 *
 * @see [Swagger link objects](https://swagger.io/docs/specification/links/)
 */
export function ApiLink({
  from,
  fromField = 'id',
  routeParam
}: ApiLinkOptions): MethodDecorator {
  return (
    controllerPrototype: object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const { prototype } = from;
    if (prototype) {
      const links = Reflect.getMetadata(DECORATORS.API_LINK, prototype) ?? [];

      links.push({
        method: descriptor.value,
        prototype: controllerPrototype,
        field: fromField,
        parameter: routeParam
      });

      Reflect.defineMetadata(DECORATORS.API_LINK, links, prototype);
    }

    return descriptor;
  };
}
