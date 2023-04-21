import { ApolloServer } from '@apollo/server';
import gql from "graphql-tag"
import Keyv from 'keyv';
import Redis from '@keyv/redis';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import { startStandaloneServer } from '@apollo/server/standalone';


const keyv = new Keyv({
    store: new Redis('redis://localhost:6379'),
    namespace: 'my-namespace:',
});

const typeDefs = gql`
  type Query {
    hello(name: String): String
  }
`;

const resolvers = {
    Query: {
        hello: async (parent, { name }, context) => {
            const cacheKey = `hello:${name}`;
            const cachedResult = await keyv.get(cacheKey);
            console.log("🚀 ~ file: index1.js:25 ~ hello: ~ cachedResult:", cachedResult)

            if (cachedResult) {
                console.log('Returning cached result:', cachedResult);
                return cachedResult;
            }

            const result = `Hello, ${name || 'World'}!`;
            console.log('Storing result in cache:', result);
            await keyv.set(cacheKey, result, 3600*24); // Cache for 1 hour
            return result;
        },
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
        {
            async serverWillStart() {
                console.log('Setting up ApolloServer cache...');
                const cache = new KeyvAdapter(keyv);
                return {
                    async store({ request, document, variables }, result) {
                        await cache.set(request, document, variables, result);
                    },
                    async lookup({ request, document, variables }) {
                        return await cache.get(request, document, variables);
                    },
                };
            },
        },
    ],
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 7000 },
});

console.log(`🚀 User Server ready at: ${url}`);