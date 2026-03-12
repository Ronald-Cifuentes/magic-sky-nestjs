import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import GraphQLJSON from 'graphql-type-json';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const depthLimit = require('graphql-depth-limit');
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { CatalogModule } from './catalog/catalog.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CmsModule } from './cms/cms.module';
import { ContactModule } from './contact/contact.module';
import { SettingsModule } from './settings/settings.module';
import { CountriesModule } from './countries/countries.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { LocalesModule } from './locales/locales.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      resolvers: { JSON: GraphQLJSON },
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      validationRules: [depthLimit(10)],
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
      formatError: (err) => {
        const code = err.extensions?.code || 'INTERNAL_ERROR';
        let message = err.message || 'An error occurred';
        const resp = (err.extensions?.exception as { response?: { message?: string | string[] } })?.response;
        if (resp?.message) {
          const msg = Array.isArray(resp.message) ? resp.message.join('; ') : resp.message;
          if (msg) message = msg;
        }
        return {
          message: process.env.NODE_ENV === 'production' && code === 'INTERNAL_SERVER_ERROR'
            ? 'Internal server error'
            : message,
          extensions: process.env.NODE_ENV === 'production' ? undefined : err.extensions,
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    CmsModule,
    ContactModule,
    SettingsModule,
    CountriesModule,
    CurrenciesModule,
    LocalesModule,
  ],
})
export class AppModule {}
