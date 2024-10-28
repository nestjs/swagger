import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

/**
 * Set the default getter for the given type to the decorated method
 *
 * This is to be used in conjunction with `ApiProperty({link: () => Type})` to generate link objects
 * in the swagger schema
 *
 * ```typescript
 * @Controller('users')
 * class UserController {
 *   @Get(':userId')
 *   @ApiDefaultGetter(UserGet, 'userId')
 *   getUser(@Param('userId') userId: string) {
 *     // ...
 *   }
 * }
 * ```
 *
 * @param type The type for which the decorated function is the default getter
 * @param parameter Name of the parameter in the route of the getter which corresponds to the id of the type
 *
 * @see [Swagger link objects](https://swagger.io/docs/specification/links/)
 */
export function ApiDefaultGetter(
  type: Type<unknown> | Function,
  parameter: string
): MethodDecorator {
  return (
    prototype: object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    if (type.prototype) {
      Reflect.defineMetadata(
        DECORATORS.API_DEFAULT_GETTER,
        { getter: descriptor.value, parameter, prototype },
        type.prototype
      );
    }

    return descriptor;
  };
}
