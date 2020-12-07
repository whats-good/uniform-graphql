import {
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLResolveInfo,
} from 'graphql';
import _ from 'lodash';
import { TypeOf } from './Brick';
import {
  AnyOutputBrick,
  OutputFieldArgumentMap,
  BrickMap,
  TMap,
} from './semi-bricks/struct-types';

export interface OutputFieldMap extends BrickMap<AnyOutputBrick> {
  [key: string]: OutputField<AnyOutputBrick, OutputFieldArgumentMap>;
}

// type Thunk<T> = () => T;

type ResolverReturnType<T> = T | Promise<T>; // TODO: add thunk support later
type ResolverReturnTypeOf<B extends AnyOutputBrick> = ResolverReturnType<
  B['B_R']
>;

// TODO: add Contextlater

type ArgTMap<T extends OutputFieldArgumentMap> = {
  [K in keyof T]: TypeOf<T[K]['brick']>;
};

type ResolverFnOfBrickAndArgs<
  B extends AnyOutputBrick,
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
> = ResolverFnOfBrickAndArgs<T[K]['brick'], T[K]['args'], R>;

// TODO: later on, enable the root to be something else, but always force a return on the field.
export type FieldResolversOf<T extends OutputFieldMap> = {
  [K in keyof T]: ResolverFnOfConfigMap<T, K, TMap<T>>;
};

export abstract class OutputField<
  B extends AnyOutputBrick,
  A extends OutputFieldArgumentMap
> {
  readonly brick: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;

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

  protected getArgsGrpahQLTypeConstructor = (): GraphQLFieldConfigArgumentMap => {
    return _.mapValues(this.args, (arg) => {
      return {
        type: arg.brick.getGraphQLType(),
        description: arg.description,
        deprecationReason: arg.deprecationReason,
      };
    });
  };

  abstract getGraphQLTypeConstructor(): GraphQLFieldConfig<any, any>;
}

export class SimpleOutputField<
  B extends AnyOutputBrick,
  A extends OutputFieldArgumentMap
> extends OutputField<B, A> {
  public getGraphQLTypeConstructor = (): GraphQLFieldConfig<any, any> => {
    return {
      type: this.brick.getGraphQLType(),
      description: this.description,
      deprecationReason: this.deprecationReason,
      args: this.getArgsGrpahQLTypeConstructor(),
    };
  };
}

export class RootQueryOutputField<
  B extends AnyOutputBrick,
  A extends OutputFieldArgumentMap
> extends OutputField<B, A> {
  public readonly resolve: ResolverFnOfBrickAndArgs<B, A, undefined>;

  constructor(params: {
    brick: B;
    args: A;
    description?: string;
    deprecationReason?: string;
    resolve: RootQueryOutputField<B, A>['resolve'];
  }) {
    super(params);
    this.resolve = params.resolve;
  }

  public getGraphQLTypeConstructor = (): GraphQLFieldConfig<any, any> => {
    return {
      type: this.brick.getGraphQLType(),
      description: this.description,
      deprecationReason: this.deprecationReason,
      args: this.getArgsGrpahQLTypeConstructor(),
      resolve: this.resolve as any, // TODO: see if there's a better solution than "any" here
    };
  };
}
