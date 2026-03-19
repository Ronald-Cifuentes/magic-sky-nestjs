import { Module } from '@nestjs/common';
import { ProductsResolver } from './products/products.resolver';
import { ProductsService } from './products/products.service';
import { CollectionsResolver } from './collections/collections.resolver';
import { CollectionsService } from './collections/collections.service';
import { CategoriesResolver } from './categories/categories.resolver';
import { CategoriesService } from './categories/categories.service';
import { BrandsResolver } from './brands/brands.resolver';
import { BrandsService } from './brands/brands.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [
    ProductsResolver,
    ProductsService,
    CollectionsResolver,
    CollectionsService,
    CategoriesResolver,
    CategoriesService,
    BrandsResolver,
    BrandsService,
  ],
  exports: [ProductsService, CollectionsService, CategoriesService],
})
export class CatalogModule {}
