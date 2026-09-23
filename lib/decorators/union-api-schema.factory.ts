import { Abstract, Type } from '@nestjs/common';
import { isEqual } from 'es-toolkit/compat';
import {
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { SwaggerTypesMapper } from '../services/swagger-types-mapper.js';
import { getSchemaPath } from '../utils/get-schema-path.util.js';
import { ApiExtraModels } from './api-extra-models.decorator.js';
import { ApiSchema } from './api-schema.decorator.js';

declare const UNION_API_SCHEMA_RESULT: unique symbol;

type SchemaModel<Result = unknown> = Type<Result> | Abstract<Result>;

type BuiltInSchemaType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ObjectConstructor
  | DateConstructor
  | BigIntConstructor;

type UnionMember = SchemaModel | BuiltInSchemaType;

type NonEmptyUnionMembers = readonly [UnionMember, ...UnionMember[]];

type ValidatedUnionMembers<Members extends NonEmptyUnionMembers> = {
  [Index in keyof Members]: Members[Index] extends
    | FunctionConstructor
    | ArrayConstructor
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

/**
 * A metadata token for a reusable OpenAPI union schema.
 * @publicApi
 */
export type UnionApiSchema<Result> = Abstract<unknown> & {
  readonly [UNION_API_SCHEMA_RESULT]: Result;
};

/**
 * Extracts the represented TypeScript union from a union schema token.
 * @publicApi
 */
export type InferUnionApiSchema<Schema extends UnionApiSchema<unknown>> =
  Schema extends UnionApiSchema<infer Result> ? Result : never;

/**
 * Options for creating a reusable OpenAPI `oneOf` component.
 * @publicApi
 */
export interface UnionApiSchemaOptions<Members extends NonEmptyUnionMembers> {
  name: string;
  oneOf: Members & ValidatedUnionMembers<Members>;
  description?: string;
  discriminator?: {
    propertyName: string;
    mapping?: Record<string, SchemaModel>;
  };
}

const swaggerTypesMapper = new SwaggerTypesMapper();

/**
 * Creates a named OpenAPI `oneOf` component and a token carrying its inferred
 * TypeScript union.
 *
 * @example
 * ```ts
 * const Pet = createUnionApiSchema({
 *   name: 'Pet',
 *   oneOf: [CatDto, DogDto]
 * });
 * type Pet = InferUnionApiSchema<typeof Pet>;
 * ```
 * @publicApi
 */
export function createUnionApiSchema<
  const Members extends NonEmptyUnionMembers
>(
  options: UnionApiSchemaOptions<Members>
): UnionApiSchema<UnionResult<Members>> {
  assertValidOptions(options);

  class UnionApiSchemaHost {}

  const modelsByPath = new Map<string, Function>();
  const unionPath = getSchemaPath(options.name);
  const oneOf = options.oneOf.reduce<Array<SchemaObject | ReferenceObject>>(
    (schemas, member) => {
      const schema = createMemberSchema(
        member,
        modelsByPath,
        unionPath,
        options.name
      );
      if (!schemas.some((existing) => isEqual(existing, schema))) {
        schemas.push(schema);
      }
      return schemas;
    },
    []
  );

  const mapping = options.discriminator?.mapping
    ? Object.fromEntries(
        Object.entries(options.discriminator.mapping).map(([key, model]) => [
          key,
          createModelReference(model, modelsByPath, unionPath, options.name)
        ])
      )
    : undefined;

  ApiSchema({
    name: options.name,
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
  })(UnionApiSchemaHost);
  ApiExtraModels(...modelsByPath.values())(UnionApiSchemaHost);

  return UnionApiSchemaHost as unknown as UnionApiSchema<UnionResult<Members>>;
}

function assertValidOptions(
  options: UnionApiSchemaOptions<NonEmptyUnionMembers>
): void {
  if (!options || typeof options.name !== 'string' || !options.name.trim()) {
    throw new TypeError('Union schema name must be a non-empty string.');
  }
  if (!Array.isArray(options.oneOf) || options.oneOf.length === 0) {
    throw new TypeError(
      `Union schema "${options.name}" must contain at least one member.`
    );
  }
}

function createMemberSchema(
  member: UnionMember,
  modelsByPath: Map<string, Function>,
  unionPath: string,
  unionName: string
): SchemaObject | ReferenceObject {
  if (member === Function) {
    throw new TypeError('Function does not describe an API schema.');
  }
  if (member === Array) {
    throw new TypeError(
      'Array does not describe a concrete API schema. Use an array DTO instead.'
    );
  }
  if (typeof member !== 'function') {
    throw new TypeError(
      'Union members must be model or built-in constructors.'
    );
  }

  const builtInSchema = swaggerTypesMapper.mapTypeToOpenAPISchema(member);
  if (builtInSchema) {
    return builtInSchema;
  }
  if (!isConstructable(member)) {
    throw new TypeError(
      'Union members must be model or built-in constructors.'
    );
  }

  return {
    $ref: createModelReference(member, modelsByPath, unionPath, unionName)
  };
}

function createModelReference(
  model: SchemaModel,
  modelsByPath: Map<string, Function>,
  unionPath: string,
  unionName: string
): string {
  if (
    !isConstructable(model) ||
    model === Function ||
    model === Array ||
    swaggerTypesMapper.mapTypeToOpenAPISchema(model)
  ) {
    throw new TypeError(
      'Discriminator mappings must reference model schema constructors.'
    );
  }

  const modelPath = getSchemaPath(model);
  if (modelPath === unionPath) {
    throw new TypeError(
      `Union schema "${unionName}" cannot reference a member with the same schema name.`
    );
  }

  const registeredModel = modelsByPath.get(modelPath);
  if (registeredModel && registeredModel !== model) {
    throw new TypeError(
      `Union schema "${unionName}" cannot reference different models with the same component schema "${modelPath}".`
    );
  }
  modelsByPath.set(modelPath, model);
  return modelPath;
}

function isConstructable(value: unknown): value is Function {
  if (typeof value !== 'function') {
    return false;
  }

  try {
    Reflect.construct(Object, [], value);
    return true;
  } catch {
    return false;
  }
}
