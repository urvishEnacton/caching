
import { ApolloServer } from '@apollo/server';
import gql from "graphql-tag"
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import Keyv from "keyv";
import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { ErrorsAreMissesCache } from "@apollo/utils.keyvaluecache";
import { InMemoryLRUCache } from 'apollo-server-caching';
const redisCache = new Keyv("redis://user:pass@localhost:6379");
const faultTolerantCache = new ErrorsAreMissesCache(
    new KeyvAdapter(redisCache),
);
const typeDefs = gql`

enum CacheControlScope {
  PUBLIC
  PRIVATE
}

directive @cacheControl(
  maxAge: Int
  scope: CacheControlScope
  inheritMaxAge: Boolean
) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

   type Query {
    getUser: [User]
  }

  type User  @cacheControl(maxAge: 240) {
    id: Int
    firstName: String
    lastName: String
    gender: String
  }
`;

const resolvers = {
    Query: {
        getUser: (_, args, ctx, info) => {
            // info.cacheControl.setCacheHint({ maxAge: 3600, scope: 'PUBLIC' });
            return Users
        }
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginCacheControl({ defaultMaxAge: 10 })],
    // cache: faultTolerantCache,
    cache: new InMemoryLRUCache({ maxSize: 100 }),
    // cache: new InMemoryLRUCache({
    //     // ~100MiB
    //     maxSize: Math.pow(2, 20) * 100,
    //     // 5 minutes (in milliseconds)
    //     ttl: 300_000,
    //   }),
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 7000 },
});
console.log(`🚀 User Server ready at: ${url}`);


const Users = [
    {
        id: 8,
        firstName: "Terry",
        lastName: "Medhurst",
        gender: "male"
    },
    {
        id: 2,
        firstName: "Sheldon",
        lastName: "Quigley",
        gender: "male"
    },
    {
        id: 3,
        firstName: "Terrill",
        lastName: "Hills",
        gender: "male"
    },
    {
        id: 4,
        firstName: "Miles",
        lastName: "Cummerata",
        gender: "male"
    },
    {
        id: 5,
        firstName: "Mavis",
        lastName: "Schultz",
        gender: "male"
    },

]

