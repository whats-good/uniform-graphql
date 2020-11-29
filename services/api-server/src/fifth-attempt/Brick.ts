import { GraphQLNonNull, GraphQLNullableType, GraphQLType } from 'graphql';
import * as t from 'io-ts';
import { SemiBrickFactory } from './SemiBrickFactory';

export type Kind =
  | 'scalar' // done
  | 'outputobject' // done
  | 'interface'
  | 'union' // done
  | 'enum' // done
  | 'inputobject' // done
  | 'outputlist' // done
  | 'inputlist'; // done

export abstract class SemiBrick<
  K extends Kind,
  SB_G extends GraphQLNullableType,
  SB_A // TODO: make sure this cant be null or undefined
> {
  SB_G!: SB_G;
  SB_A!: SB_A;
  readonly name: string;
  readonly semiBrickFactory: SemiBrickFactory;
  abstract kind: K;
  abstract getFreshSemiGraphQLType(): SB_G;

  abstract readonly nullable: Brick<
    K,
    SB_G,
    SemiBrick<K, SB_G, SB_A>,
    SB_A | null | undefined // TODO: consider adding void here, to help with non-returning resolvers
  >;
  abstract readonly nonNullable: Brick<
    K,
    GraphQLNonNull<any>,
    SemiBrick<K, SB_G, SB_A>,
    SB_A
  >;

  // TODO: find a way for this "resolveAs" method to handle promises and thunks

  // public resolveAs = async (x: SB_A) => {
  //   const resolvedX = await x;
  //   return {
  //     ...resolvedX,
  //     __typename: this.name,
  //   };
  // };

  public getSemiGraphQLType = (): SB_G => {
    return this.semiBrickFactory.getSemiGraphQLTypeOf(
      this,
      this.getFreshSemiGraphQLType,
    );
  };

  constructor(params: { name: string; semiBrickFactory: SemiBrickFactory }) {
    this.name = params.name;
    this.semiBrickFactory = params.semiBrickFactory;
  }
}

export type AnySemiBrick<K extends Kind = any> = SemiBrick<K, any, any>;
export type AnyBrick<K extends Kind = any> = Brick<
  K,
  any,
  AnySemiBrick<K>,
  any
>;
interface Kinded {
  kind: Kind;
}
export type KindOf<T extends Kinded> = T['kind'];
export type SemiTypeOf<SB extends AnySemiBrick> = SB['SB_A'];
export type SemiGraphQLTypeOf<SB extends AnySemiBrick> = ReturnType<
  SB['getSemiGraphQLType']
>;
export type TypeOf<B extends AnyBrick> = B['B_A'];
export type GraphQLTypeOf<B extends AnyBrick> = B['B_G'];

export type NullableBrickOf<SB extends AnySemiBrick> = Brick<
  KindOf<SB>,
  SemiGraphQLTypeOf<SB>,
  SB,
  SemiTypeOf<SB> | null | undefined
>;

export type NonNullableBrickOf<SB extends AnySemiBrick> = Brick<
  KindOf<SB>,
  GraphQLNonNull<any>,
  SB,
  SemiTypeOf<SB>
>;

export class Brick<
  K extends Kind,
  B_G extends GraphQLType,
  SB extends AnySemiBrick<K>,
  B_A
> {
  B_A!: B_A;
  B_G!: B_G;
  public readonly name: string;
  public readonly kind: K;
  public readonly semiBrick: SB;
  public readonly getGraphQLType: () => B_G;

  constructor(params: {
    name: string;
    kind: K;
    getGraphQLType: () => B_G;
    semiBrick: SB;
  }) {
    this.name = params.name;
    this.kind = params.kind;
    this.getGraphQLType = params.getGraphQLType;
    this.semiBrick = params.semiBrick;
  }

  static initNullable<SB extends AnySemiBrick>(sb: SB): NullableBrickOf<SB> {
    return new Brick({
      name: sb.name,
      kind: sb.kind,
      getGraphQLType: sb.getSemiGraphQLType,
      semiBrick: sb,
    });
  }

  static initNonNullable<SB extends AnySemiBrick>(
    sb: SB,
  ): NonNullableBrickOf<SB> {
    return new Brick({
      name: sb.name,
      getGraphQLType: () => new GraphQLNonNull(sb.getSemiGraphQLType()),
      kind: sb.kind,
      semiBrick: sb,
    });
  }
}
