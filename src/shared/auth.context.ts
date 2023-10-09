import { prisma } from './prisma-singleton.js';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { GraphQLError } from 'graphql';

export const authContext = async ({ req }) => {
  const { default: KeycloakAdminClient } = await import(
    '@keycloak/keycloak-admin-client'
  );

  if (req.headers?.authorization) {
    const token = req.headers.authorization.split(' ')[1];

    try {
      await axios.get(
        `https://${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM_NAME}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        },
      );

      const kcAdminClient = new KeycloakAdminClient({
        baseUrl: `https://${process.env.KEYCLOAK_BASE_URL}`,
        realmName: process.env.KEYCLOAK_REALM_NAME,
      });

      const decodedData: any = jwt.decode(token);

      await kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      });

      const response = await kcAdminClient.users.findOne({
        id: String(decodedData.sub),
        realm: process.env.KEYCLOAK_REALM_NAME,
      });

      // Find user in database
      let user = await prisma.users.findFirst({
        where: {
          auth_id: response.id,
        },
      });

      // If not found then create the user
      if (!user) {
        user = await prisma.users.create({
          data: {
            auth_id: response.id,
            mobile_number: response.username,
            name: `${response.firstName} ${response.lastName}`,
            email: response.email,
            mobile_code: response.attributes
              ? `+${response.attributes.countryCode}`
              : null,
          },
        });
      }

      // send the user data forward
      return {
        user: {
          ...user,
          accessToken: token,
          sessionId: decodedData?.sid,
        },
      };
    } catch (error) {
      console.log(error.message);
      throw new GraphQLError('UNAUTHENTICATED');
    }
  }
};

/*

decoded data example:
{
  exp: 1694466327,
  iat: 1694430328,
  auth_time: 1694430327,
  jti: 'a96908f5-46c7-4c9b-a122-c64772abb349',
  iss: 'https://dev-auth-gdb2c.binary-labs.in/realms/gdb2c-dev',
  aud: 'account',
  sub: '4ff649fa-2cbc-485a-aa0c-974f2078dc61',
  typ: 'Bearer',
  azp: 'account-console',
  nonce: '097e6c0b-4094-4a85-8f1c-4cabf8811954',
  session_state: '86731942-0df9-4040-82e6-15c125a55626',
  acr: '1',
  resource_access: { account: { roles: [Array] } },
  scope: 'openid email profile',
  sid: '86731942-0df9-4040-82e6-15c125a55626',
  email_verified: false,
  name: 'Mayank Vats',
  preferred_username: 'mayank',
  given_name: 'Mayank',
  family_name: 'Vats',
  email: 'mayank@binaryveda.com'
}
*/
