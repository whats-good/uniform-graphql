import {
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLResolveInfo,
} from 'graphql';
import _ from 'lodash';
import { TypeOf } from './StaticGraphQLType';
import {
  AnyOutputStaticGraphQLType,
  OutputFieldArgumentMap,
  StaticGraphQLTypeMap,
  TMap,
} from './types/struct-types';

export interface OutputFieldMap
  extends StaticGraphQLTypeMap<AnyOutputStaticGraphQLType> {
  [key: string]: OutputField<
    AnyOutputStaticGraphQLType,
    OutputFieldArgumentMap
  >;
}

export interface RootQueryOutputFieldMap
  extends StaticGraphQLTypeMap<AnyOutputStaticGraphQLType> {
  [key: string]: RootQueryOutputField<
    AnyOutputStaticGraphQLType,
    OutputFieldArgumentMap
  >;
}

// type Thunk<T> = () => T;

type ResolverReturnType<T> = T | Promise<T>; // TODO: add thunk support later
type ResolverReturnTypeOf<
  B extends AnyOutputStaticGraphQLType
> = ResolverReturnType<B['B_R']>;

// TODO: add Contextlater

type ArgTMap<T extends OutputFieldArgumentMap> = {
  [K in keyof T]: TypeOf<T[K]['brick']>;
};

type ResolverFnOfStaticGraphQLTypeAndArgs<
  B extends AnyOutputStaticGraphQLType,
  A extends OutputFieldArgumentMap,
  R
> = (
  root: R,
  args: ArgTMap<A>,
  ctx: any,
  info: GraphQLResolveInfo,
) => ResolverReturnTypeOf<B>;

type ResolverFnOfConfigMap<
  T extends OutputFieldMap,
  K extends keyof T,
  R
> = ResolverFnOfStaticGraphQLTypeAndArgs<T[K]['brick'], T[K]['args'], R>;

// TODO: later on, enable the root to be something else, but always force a return on the field.
export type FieldResolversOf<T extends OutputFieldMap> = {
  [K in keyof T]: ResolverFnOfConfigMap<T, K, TMap<T>>;
};

export abstract class OutputField<
  B extends AnyOutputStaticGraphQLType,
  A extends OutputFieldArgumentMap
> {
  readonly brick: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;

  public resolve: unknown; // TODO: see if there's a better solution than any here

  constructor(params: {
    brick: B;
    args: A;
    description?: string;
    deprecationReason?: string;
  }) {
    this.brick = params.brick;
    this.args = params.args;
    this.description = params.description;
    this.deprecationReason = params.deprecationReason;
  }

  private getArgsGraphQLTypeConstructor = (): GraphQLFieldConfigArgumentMap => {
    return _.mapValues(this.args, (arg) => {
      return {
        type: arg.brick.getGraphQLType(),
        description: arg.description,
        deprecationReason: arg.deprecationReason,
      };
    });
  };

  public setResolve = <R>(
    resolve: ResolverFnOfStaticGraphQLTypeAndArgs<B, A, R>,
  ): void => {
    this.resolve = resolve;
  };

  public getGraphQLTypeConstructor = (): GraphQLFieldConfig<any, any> => {
    return {
      type: this.brick.getGraphQLType(),
      description: this.description,
      deprecationReason: this.deprecationReason,
      args: this.getArgsGraphQLTypeConstructor(),
      resolve: this.resolve as any,
    };
  };
}

export class SimpleOutputField<
  B extends AnyOutputStaticGraphQLType,
  A extends OutputFieldArgumentMap
> extends OutputField<B, A> {}

export class RootQueryOutputField<
  B extends AnyOutputStaticGraphQLType,
  A extends OutputFieldArgumentMap
> extends OutputField<B, A> {
  constructor(params: {
    brick: B;
    args: A;
    description?: string;
    deprecationReason?: string;
    resolve: ResolverFnOfStaticGraphQLTypeAndArgs<B, A, undefined>;
  }) {
    super(params);
    this.resolve = params.resolve;
  }
}
