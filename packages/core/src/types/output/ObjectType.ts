import { GraphQLObjectType } from 'graphql';
import { Thunkable, Promisable, Unthunked } from '../../utils';
import { ResolveTypeOf } from '../../Resolver';
import { AnySchemaBuilder } from '../../SchemaBuilder';
import { InternalType, RealizedType } from '../core';
import {
  ObfuscatedOutputFieldsMap,
  OutputFieldsMap,
  toGraphQLFieldConfigMap,
  TypeInOutputMapValue,
  TypeOfOutputFieldsMap,
} from './OutputFieldsMap';

export interface IOutputObjectInternalTypeConstructorParams<
  N extends string,
  M extends OutputFieldsMap
> {
  name: N;
  fields: M;
  description?: string;
}

export type InternalResolveTypeOfObjectInternalType<
  I extends ObjectInternalType<any, any>
> = {
  [K in keyof I['fields']]: Thunkable<
    Promisable<ResolveTypeOf<TypeInOutputMapValue<Unthunked<I['fields'][K]>>>>
  >;
};

export type InternalResolveTypeOfObjectType<
  R extends ObjectType<any, any, any>
> = InternalResolveTypeOfObjectInternalType<R['internalType']>;

export class ObjectInternalType<
  N extends string,
  M extends OutputFieldsMap
> extends InternalType<N, TypeOfOutputFieldsMap<M>> {
  public readonly fields: M;
  public readonly description?: string;

  constructor(params: IOutputObjectInternalTypeConstructorParams<N, M>) {
    super(params);
    this.fields = params.fields;
    this.description = params.description;
  }

  protected getFreshInternalGraphQLType(
    schemaBuilder: AnySchemaBuilder,
  ): GraphQLObjectType {
    return new GraphQLObjectType({
      name: this.name,
      description: this.description,
      interfaces: () => {
        const interfaces = schemaBuilder.getImplementedInterfaces(this);
        if (!interfaces.length) {
          return null;
        }
        return interfaces.map(
          (cur) => cur.getInternalGraphQLType(schemaBuilder) as any,
        );
      },
      fields: () =>
        toGraphQLFieldConfigMap({
          fields: this.fields,
          schemaBuilder,
          objectName: this.name,
        }),
    });
  }
}

export type ObjectType<
  N extends string,
  M extends OutputFieldsMap,
  NULLABLE extends boolean = false
> = RealizedType<ObjectInternalType<N, ObfuscatedOutputFieldsMap<M>>, NULLABLE>;

export const object = <N extends string, M extends OutputFieldsMap>(
  params: IOutputObjectInternalTypeConstructorParams<N, M>,
): ObjectType<N, M> => {
  const internalType: ObjectInternalType<
    N,
    ObfuscatedOutputFieldsMap<M>
  > = new ObjectInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};
