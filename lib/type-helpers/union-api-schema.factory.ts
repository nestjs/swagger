import { Abstract, Type } from '@nestjs/common';
import { DECORATORS } from '../constants.js';
import { ApiExtraModels, ApiSchema } from '../decorators/index.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { getSchemaPath } from '../utils/get-schema-path.util.js';

declare const UNION_API_SCHEMA_RESULT: unique symbol;

type SchemaModel<Result = unknown> = Type<Result> | Abstract<Result>;

type BuiltInSchemaType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ObjectConstructor
  | ArrayConstructor
  | DateConstructor
  | BigIntConstructor;

type UnionMember = SchemaModel | BuiltInSchemaType;

type NonEmptyUnionMembers = readonly [UnionMember, ...UnionMember[]];

type ValidatedUnionMembers<Members extends NonEmptyUnionMembers> = {
  [Index in keyof Members]: Members[Index] extends FunctionConstructor
    ? never
    : Members[Index];
};

type MemberResult<Member> = Member extends StringConstructor
  ? string
  : Member extends NumberConstructor
    ? number
    : Member extends BooleanConstructor
      ? boolean
      : Member extends ObjectConstructor
        ? object
        : Member extends ArrayConstructor
          ? unknown[]
          : Member extends DateConstructor
            ? Date
            : Member extends BigIntConstructor
              ? bigint
              : Member extends UnionApiSchema<infer Result>
                ? Result
                : Member extends Type<infer Result>
                  ? Result
                  : Member extends Abstract<infer Result>
                    ? Result
                    : never;

type UnionResult<Members extends NonEmptyUnionMembers> = MemberResult<
  Members[number]
>;

type DiscriminatorTarget<Members extends NonEmptyUnionMembers> = Exclude<
  Members[number],
  BuiltInSchemaType
>;

export type UnionApiSchema<Result> = Abstract<unknown> & {
  readonly [UNION_API_SCHEMA_RESULT]: Result;
};

export type InferUnionApiSchema<Schema extends UnionApiSchema<unknown>> =
  Schema extends UnionApiSchema<infer Result> ? Result : never;

export interface UnionApiSchemaOptions<Members extends NonEmptyUnionMembers> {
  name: string;
  oneOf: Members & ValidatedUnionMembers<Members>;
  description?: string;
  discriminator?: {
    propertyName: string;
    mapping?: Record<string, DiscriminatorTarget<Members>>;
  };
}

export function createUnionApiSchema<
  const Members extends NonEmptyUnionMembers
>(
  options: UnionApiSchemaOptions<Members>
): UnionApiSchema<UnionResult<Members>> {
  class UnionApiSchemaHost {}

  const models = new Set<Function>();
  const unionPath = getSchemaPath(options.name);
  const oneOf = options.oneOf.map((member) => {
    const builtInSchema = getBuiltInSchema(member);
    if (builtInSchema) {
      return builtInSchema;
    }
    if (member === Function) {
      throw new TypeError('Function does not describe an API schema.');
    }

    const memberPath = getSchemaPath(member);
    if (memberPath === unionPath) {
      throw new TypeError(
        `Union schema "${options.name}" cannot reference a member with the same schema name.`
      );
    }
    models.add(member);
    return { $ref: memberPath };
  });

  const mapping = options.discriminator?.mapping
    ? Object.fromEntries(
        Object.entries(options.discriminator.mapping).map(([key, model]) => {
          models.add(model);
          return [key, getSchemaPath(model)];
        })
      )
    : undefined;

  Reflect.defineMetadata(
    DECORATORS.API_UNION_SCHEMA,
    {
      oneOf,
      ...(options.description !== undefined
        ? { description: options.description }
        : {}),
      ...(options.discriminator
        ? {
            discriminator: {
              propertyName: options.discriminator.propertyName,
              ...(mapping ? { mapping } : {})
            }
          }
        : {})
    } satisfies SchemaObject,
    UnionApiSchemaHost
  );
  ApiSchema({ name: options.name })(UnionApiSchemaHost);
  ApiExtraModels(...models)(UnionApiSchemaHost);

  return UnionApiSchemaHost as unknown as UnionApiSchema<UnionResult<Members>>;
}

function getBuiltInSchema(member: UnionMember): SchemaObject | undefined {
  if (member === String) {
    return { type: 'string' };
  }
  if (member === Number) {
    return { type: 'number' };
  }
  if (member === Boolean) {
    return { type: 'boolean' };
  }
  if (member === Object) {
    return { type: 'object' };
  }
  if (member === Array) {
    return { type: 'array', items: {} };
  }
  if (member === Date) {
    return { type: 'string', format: 'date-time' };
  }
  if (member === BigInt) {
    return { type: 'integer', format: 'int64' };
  }
}
