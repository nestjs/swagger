import { Type } from '@nestjs/common';
import {
  MappedType,
  IntersectionType as intersect
} from '@nestjs/mapped-types';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function IntersectionType<A, B>(
  target: Type<A>,
  source: Type<B>
): MappedType<A & B>;

export function IntersectionType<A, B, C>(
  target: Type<A>,
  sourceB: Type<B>,
  sourceC: Type<C>
): MappedType<A & B & C>;

export function IntersectionType<A, B, C, D>(
  target: Type<A>,
  sourceB: Type<B>,
  sourceC: Type<C>,
  sourceD: Type<D>
): MappedType<A & B & C & D>;

export function IntersectionType<A, B, C, D, E>(
  target: Type<A>,
  sourceB: Type<B>,
  sourceC: Type<C>,
  sourceD: Type<D>,
  sourceE: Type<E>
): MappedType<A & B & C & D & E>;

export function IntersectionType<A, B, C, D, E, F>(
  target: Type<A>,
  sourceB: Type<B>,
  sourceC: Type<C>,
  sourceD: Type<D>,
  sourceE: Type<E>,
  sourceF: Type<F>
): MappedType<A & B & C & D & E & F>;

export function IntersectionType<A, B, C, D, E, F, G>(
  target: Type<A>,
  sourceB: Type<B>,
  sourceC: Type<C>,
  sourceD: Type<D>,
  sourceE: Type<E>,
  sourceF: Type<F>,
  sourceG: Type<G>
): MappedType<A & B & C & D & E & F & G>;

export function IntersectionType<A, B, C, D, E, F, G, H>(
  target: Type<A>,
  sourceB: Type<B>,
  sourceC: Type<C>,
  sourceD: Type<D>,
  sourceE: Type<E>,
  sourceF: Type<F>,
  sourceG: Type<G>,
  sourceH: Type<H>
): MappedType<A & B & C & D & E & F & G & H>;

export function IntersectionType<A, T extends Type[]>(
  target: Type<A>,
  ...sources: T
): MappedType<A> {
  const classRefs = [target, ...sources];

  const IntersectionClass: MappedType<A> = (intersect as any)(...classRefs);

  classRefs.forEach((classRef) => {
    clonePluginMetadataFactory(IntersectionClass, classRef.prototype);

    const propertyKeys = modelPropertiesAccessor.getModelProperties(
      classRef.prototype
    );

    propertyKeys.forEach((propertyKey) => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        classRef.prototype,
        propertyKey
      );

      const decorator = ApiProperty(metadata);

      decorator(IntersectionClass.prototype, propertyKey);
    });
  });

  return IntersectionClass;
}
