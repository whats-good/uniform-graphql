import { GraphQLEnumType } from 'graphql';
import { InternalType, RealizedType } from './core';
import { mapValues, StringKeys } from '../utils';

interface IEnumValue {
  deprecationReason?: string;
  description?: string;
}

type EnumValuesMap = StringKeys<IEnumValue | null>;

interface IEnumTypeConstructorParams<
  N extends string,
  D extends EnumValuesMap
> {
  name: N;
  description?: string;
  values: D;
}

export class EnumInternalType<
  N extends string,
  D extends EnumValuesMap
> extends InternalType<N, keyof D> {
  public readonly description?: string;
  public readonly valuesConfig: D;

  public constructor(params: IEnumTypeConstructorParams<N, D>) {
    super(params);
    this.description = params.description;
    this.valuesConfig = params.values;
  }

  public get values(): { [K in keyof D]: K } {
    return mapValues(this.valuesConfig, (value, key) => key) as any;
  }

  protected getFreshInternalGraphQLType(): GraphQLEnumType {
    return new GraphQLEnumType({
      name: this.name,
      description: this.description,
      values: mapValues(this.valuesConfig, (value, key) => {
        return {
          value: key,
          description: value?.description,
          deprecationReason: value?.deprecationReason,
        };
      }),
    });
  }
}

export type EnumType<
  N extends string,
  D extends EnumValuesMap,
  NULLABLE extends boolean = false
> = RealizedType<EnumInternalType<N, D>, NULLABLE>;

export const enu = <N extends string, D extends EnumValuesMap>(
  params: IEnumTypeConstructorParams<N, D>,
): EnumType<N, D, false> => {
  const internalType = new EnumInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};
