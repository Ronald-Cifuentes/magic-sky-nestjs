import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { ObjectType, Field } from '@nestjs/graphql';
import { ProductVariant } from '../catalog/products/entities/product-variant.entity';

@ObjectType()
export class CartItemType {
  @Field() id: string;
  @Field() quantity: number;
  @Field(() => ProductVariant) variant: ProductVariant;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field(() => String, { nullable: true }) productSlug?: string | null;
  @Field(() => String, { nullable: true }) productTitle?: string | null;
}

@ObjectType()
export class CartType {
  @Field() id: string;
  @Field() currency: string;
  @Field(() => [CartItemType]) items: CartItemType[];
}

@Resolver(() => CartItemType)
export class CartItemResolver {
  @ResolveField(() => String, { nullable: true })
  imageUrl(@Parent() item: { variant?: { product?: { images?: { url: string }[] } } }) {
    return item.variant?.product?.images?.[0]?.url ?? null;
  }

  @ResolveField(() => String, { nullable: true })
  productSlug(@Parent() item: { variant?: { product?: { slug: string } } }) {
    return item.variant?.product?.slug ?? null;
  }

  @ResolveField(() => String, { nullable: true })
  productTitle(@Parent() item: { variant?: { product?: { title: string } } }) {
    return item.variant?.product?.title ?? null;
  }
}

@Resolver(() => CartType)
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Query(() => CartType)
  async cart(
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @Args('customerId', { nullable: true }) customerId?: string,
  ) {
    return this.cartService.getOrCreateCart(customerId, sessionId);
  }

  @Mutation(() => CartItemType, { nullable: true })
  async addToCart(
    @Args('variantId') variantId: string,
    @Args('quantity', { defaultValue: 1 }) quantity: number,
    @Args('cartId', { nullable: true }) cartId?: string,
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @Args('customerId', { nullable: true }) customerId?: string,
  ) {
    const cart = await this.cartService.getOrCreateCart(customerId, sessionId);
    const targetCartId = cartId || cart.id;
    return this.cartService.addItem(targetCartId, variantId, quantity);
  }

  @Mutation(() => CartItemType, { nullable: true })
  async updateCartItem(
    @Args('cartItemId') cartItemId: string,
    @Args('quantity') quantity: number,
  ) {
    return this.cartService.updateItem(cartItemId, quantity);
  }

  @Mutation(() => Boolean)
  async removeCartItem(@Args('cartItemId') cartItemId: string) {
    return this.cartService.removeItem(cartItemId);
  }
}
