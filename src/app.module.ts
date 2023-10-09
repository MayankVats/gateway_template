import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { subgraphs } from './shared/subgraphs';
import { authContext } from './shared/auth.context';
import { format, transports } from 'winston';
import { WinstonModule } from 'nest-winston';

const customFormat = format.printf(({ level, message, timestamp, stack }) => {
  let logFormat = `${timestamp} [${level}] : ${JSON.stringify(
    message,
    null,
    2,
  )}`;

  if (level == 'http') {
    logFormat = `${timestamp} [${level}] : [${message.reqId}][${message.userId}] : ${message.queryType} ${message.query}`;
  }

  if (stack) {
    logFormat = logFormat + JSON.stringify(stack, null, 2);
  }
  return logFormat;
});
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      useFactory: () => ({
        server: {
          playground: false,
          context: authContext,
          formatError: (formattedError, _) => {
            if (formattedError.message.includes('UNAUTHENTICATED')) {
              return {
                message: formattedError.message,
                success: false,
              };
            }
            return formattedError;
          },
          plugins: [ApolloServerPluginLandingPageLocalDefault()],
        },
        gateway: {
          // https://www.apollographql.com/docs/apollo-server/using-federation/api/apollo-gateway/#class-introspectandcompose
          supergraphSdl: new IntrospectAndCompose({
            subgraphs: subgraphs,
          }),
          // https://www.apollographql.com/docs/apollo-server/using-federation/apollo-gateway-setup#customizing-requests
          buildService({ url }) {
            return new RemoteGraphQLDataSource({
              url,
              willSendRequest({ request, context }) {
                request.http.headers.set(
                  'user',
                  context.user ? JSON.stringify(context.user) : null,
                );
              },
            });
          },
        },
      }),
    }),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        format: format.combine(format.timestamp(), customFormat),
        transports: [new transports.Console()],
      }),
    }),
    ConfigModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
