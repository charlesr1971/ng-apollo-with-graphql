import { NgModule } from '@angular/core';
import { Apollo, ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';

/* const uri = 'http://localhost:4000'; // <-- add the URL of the GraphQL server here
//const uri = 'https://app.establishmindfulness.com:4000'; // <-- add the URL of the GraphQL server here
export function createApollo(httpLink: HttpLink) {
  return {
    link: httpLink.create({uri}),
    cache: new InMemoryCache(),
  };
} */

const uri = 'http://localhost:4000'; // <-- add the URL of the GraphQL server here
const wsUri = 'ws://localhost:4000/subscriptions';
//const wsUri = 'wss://app.establishmindfulness.com:4000/subscriptions';

export function createApollo(httpLink: HttpLink) {

  // Create an http link:
  const http = httpLink.create({
    uri: uri
  });

  // Create a WebSocket link:
  const ws = new WebSocketLink({
    uri: wsUri,
    options: {
      reconnect: true
    }
  });

  // using the ability to split links, you can send data to each link
  // depending on what kind of operation is being sent
  const link = split(
    // split based on operation type
    ({ query }) => {
      let definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    ws,
    http,
  );

  return {
    link: link,
    cache: new InMemoryCache(),
  };
}

@NgModule({
  exports: [ApolloModule, HttpLinkModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
