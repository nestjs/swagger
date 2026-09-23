import { SchemaObject } from '../interfaces/open-api-spec.interface.js';

interface SchemaRegistration {
  models: Set<Function>;
  hasEnum: boolean;
  hasStandardSchema: boolean;
  dependencies: Set<string>;
  usedInRawSchema: boolean;
}

/** Shared ownership tracking for all schema factories writing one document. */
export class SchemaComponentRegistry {
  // Weak keys avoid retaining completed documents and isolate separate scans.
  private static readonly registrations = new WeakMap<
    Record<string, SchemaObject>,
    Map<string, SchemaRegistration>
  >();

  static registerModel(
    name: string,
    type: Function,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[],
    isRawSchema: boolean
  ): void {
    this.getRegistration(name, schemas).models.add(type);
    this.registerDependency(name, schemas, pendingSchemaRefs, isRawSchema);
  }

  static registerEnum(
    name: string,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[] = []
  ): void {
    this.getRegistration(name, schemas).hasEnum = true;
    this.registerDependency(name, schemas, pendingSchemaRefs);
  }

  static registerStandardSchemas(
    components: Record<string, SchemaObject>,
    schemas: Record<string, SchemaObject>
  ): void {
    for (const name of Object.keys(components)) {
      this.getRegistration(name, schemas).hasStandardSchema = true;
      this.registerDependency(name, schemas, []);
    }
  }

  private static getRegistration(
    name: string,
    schemas: Record<string, SchemaObject>
  ): SchemaRegistration {
    let registrations = this.registrations.get(schemas);
    if (!registrations) {
      registrations = new Map();
      this.registrations.set(schemas, registrations);
    }
    if (!registrations.has(name)) {
      registrations.set(name, {
        models: new Set<Function>(),
        hasEnum: false,
        hasStandardSchema: false,
        dependencies: new Set<string>(),
        usedInRawSchema: false
      });
    }
    return registrations.get(name);
  }

  private static registerDependency(
    name: string,
    schemas: Record<string, SchemaObject>,
    pendingSchemaRefs: string[],
    isRawSchema = false
  ): void {
    const registration = this.getRegistration(name, schemas);
    const parentName = pendingSchemaRefs[pendingSchemaRefs.length - 1];
    if (parentName && parentName !== name) {
      this.getRegistration(parentName, schemas).dependencies.add(name);
    }

    if (
      isRawSchema ||
      registration.usedInRawSchema ||
      pendingSchemaRefs.some(
        (parent) => this.getRegistration(parent, schemas).usedInRawSchema
      )
    ) {
      // Dependencies include cached and currently explored models. Promoting
      // the graph also checks properties visited before a recursive union was
      // discovered, without evaluating lazy type resolvers a second time.
      const visited = new Set<string>();
      const pending = [name];
      while (pending.length > 0) {
        const currentName = pending.pop();
        if (visited.has(currentName)) {
          continue;
        }
        visited.add(currentName);
        const entry = this.getRegistration(currentName, schemas);
        entry.usedInRawSchema = true;
        if (entry.models.size > 1) {
          throw new Error(
            `Different models cannot share the component schema "${currentName}" when used in a raw combinator schema.`
          );
        }
        if (entry.hasEnum && entry.models.size > 0) {
          throw new Error(
            `Models and enums cannot share the component schema "${currentName}" when used in a raw combinator schema.`
          );
        }
        if (
          entry.hasStandardSchema &&
          (entry.models.size > 0 || entry.hasEnum)
        ) {
          throw new Error(
            `Standard Schema components cannot share the component schema "${currentName}" with models or enums when used in a raw combinator schema.`
          );
        }
        pending.push(...entry.dependencies);
      }
    }
  }
}
