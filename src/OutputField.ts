import {
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLResolveInfo,
} from 'graphql';
import _ from 'lodash';
import { TypeOf } from './Type';
import {
  AnyOutputType,
  OutputFieldArgumentMap,
  TypeMap,
  TMap,
} from './types/struct-types';

export interface OutputFieldMap extends TypeMap<AnyOutputType> {
  [key: string]: OutputField<AnyOutputType, OutputFieldArgumentMap>;
}

export interface RootOutputFieldMap<C> extends TypeMap<AnyOutputType> {
  [key: string]: RootOutputField<AnyOutputType, OutputFieldArgumentMap, C>;
}

// type Thunk<T> = () => T;

type ResolverReturnType<T> = T | Promise<T>; // TODO: add thunk support later
type ResolverReturnTypeOf<B extends AnyOutputType> = ResolverReturnType<
  B['B_R']
>;

// TODO: add Contextlater

type ArgTMap<T extends OutputFieldArgumentMap> = {
  [K in keyof T]: TypeOf<T[K]['type']>;
};

export type ResolverFnOfTypeAndArgs<
  B extends AnyOutputType,
  A extends OutputFieldArgumentMap,
  R,
  C
> = (
  root: R,
  args: ArgTMap<A>,
  ctx: C,
  info: GraphQLResolveInfo,
) => ResolverReturnTypeOf<B>;

// TODO: later on, enable the root to be something else, but always force a return on the field.
// TODO: fix the "any" context here
export type FieldResolversOf<F extends OutputFieldMap, C> = {
  [K in keyof F]: ResolverFnOfTypeAndArgs<
    F[K]['type'],
    F[K]['args'],
    TMap<F>,
    C
  >;
};

export abstract class OutputField<
  B extends AnyOutputType,
  A extends OutputFieldArgumentMap
> {
  readonly type: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;

  public resolve: unknown; // TODO: see if there's a better solution than any here

  constructor({
    type,
    args = {} as any,
    description,
    deprecationReason,
  }: {
    type: B;
    args?: A;
    description?: string;
    deprecationReason?: string;
  }) {
    this.type = type;
    this.args = args;
    this.description = description;
    this.deprecationReason = deprecationReason;
  }

  private getArgsGraphQLTypeConstructor = (): GraphQLFieldConfigArgumentMap => {
    return _.mapValues(this.args, (arg) => {
      return {
        type: arg.type.getGraphQLType(),
        description: arg.description,
        deprecationReason: arg.deprecationReason,
      };
    });
  };

  public setResolve = <R>(
    // TODO: fix the any resolver here
    resolve: ResolverFnOfTypeAndArgs<B, A, R, any>,
  ): void => {
    this.resolve = resolve;
  };

  public getGraphQLTypeConstructor = (): GraphQLFieldConfig<any, any> => {
    return {
      type: this.type.getGraphQLType(),
      description: this.description,
      deprecationReason: this.deprecationReason,
      args: this.getArgsGraphQLTypeConstructor(),
      resolve: this.resolve as any,
    };
  };
}

export class SimpleOutputField<
  B extends AnyOutputType,
  A extends OutputFieldArgumentMap
> extends OutputField<B, A> {}

export const field = <
  T extends AnyOutputType,
  A extends OutputFieldArgumentMap
>(
  type: T,
  // @ts-ignore TODO: see if we can fix this
  args?: A = {},
  options: {
    description?: string;
    deprecationreason?: string;
  } = {},
): SimpleOutputField<T, OutputFieldArgumentMap> => {
  return new SimpleOutputField({
    type,
    args,
    deprecationReason: options.deprecationreason,
    description: options.description,
  });
};

export class RootOutputField<
  B extends AnyOutputType,
  A extends OutputFieldArgumentMap,
  C
> extends OutputField<B, A> {
  constructor({
    type,
    args,
    description,
    deprecationReason,
    resolve,
  }: {
    type: B;
    args: A;
    description?: string;
    deprecationReason?: string;
    resolve: ResolverFnOfTypeAndArgs<B, A, undefined, C>;
  }) {
    args;
    super({
      type,
      args,
      deprecationReason,
      description,
    });
    this.resolve = resolve;
  }
}
