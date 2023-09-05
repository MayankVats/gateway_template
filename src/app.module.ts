import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { IntrospectAndCompose } from '@apollo/gateway';
import { AuthGuard, KeycloakConnectModule } from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from './config/config.service';
import { subgraphs } from './shared/subgraphs';
import { authContext } from './shared/authContext';

const configService = new ConfigService();
const config = configService.get();

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        playground: false,
        context: authContext,
        plugins:
          config.NODE_ENV === 'dev'
            ? [ApolloServerPluginLandingPageLocalDefault()]
            : [],
      },
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: subgraphs,
        }),
      },
    }),
    KeycloakConnectModule.register({
      authServerUrl: 'http://localhost:8080',
      realm: 'master',
      clientId: 'my-nestjs-app',
      secret: 'secret',
    }),
    ConfigModule,
  ],
  controllers: [],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
