import { Module } from '@nestjs/common';
import { ProductsResolver } from './products/products.resolver';
import { ProductsService } from './products/products.service';
import { CollectionsResolver } from './collections/collections.resolver';
import { CollectionsService } from './collections/collections.service';
import { CategoriesResolver } from './categories/categories.resolver';
import { CategoriesService } from './categories/categories.service';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    CollectionsResolver,
    CollectionsService,
    CategoriesResolver,
    CategoriesService,
  ],
  exports: [ProductsService, CollectionsService, CategoriesService],
})
export class CatalogModule {}
