const { GraphQLServer } = require("graphql-yoga");

const typeDefs = `

    type User {
        id: Int!
        name: String!
        balance: Int
    }

    type Bet {
        id: Int!
        userId: Int!
        betAmount: Int!
        chance: Int!
        payout: Int!
        win: Int!
    }

    type Query {
        users: [User!]
        user(id: Int!): User
        bets: [Bet!]
        bet(id: Int!): Bet
    }

    type Mutation {
        post(userId: Int!, betAmount: Int!, chance: Int!, payout: Int!, win: Int!): Bet!
    }

`;

const users = [{
    id: 1,
    name: "John Morris",
    balance: 10
}, {
    id: 2,
    name: "Alan Davies",
    balance: 5
}, {
    id: 3,
    name: "Peter Williams",
    balance: 150
}];

const bets = [{
    id: 1,
    userId: 1,
    betAmount: 55,
    chance: 4,
    payout: 50,
    win: false
}, {
    id: 2,
    userId: 2,
    betAmount: 8,
    chance: 2,
    payout: 4,
    win: false
}, {
    id: 3,
    userId: 2,
    betAmount: 550,
    chance: 8,
    payout: 100,
    win: false
}];

const resolvers = {
    Query: {
        users: function (root, args, context, info) {
            return users;
        },
        user: (root, args, context, info) => users.find(e => e.id === args.id),
        bets: function (root, args, context, info) {
            return bets;
        },
        bet: (root, args, context, info) => bets.find(e => e.id === args.id)
    },
    Mutation: {
        post: (parent, args) => {
          const bet = {
            userId: args.userId,
            betAmount: args.betAmount,
            chance: args.chance,
            payout: args.payout,
            win: args.win
          };
          bets.push(bet);
          return bet;
        }
    },
    User: {
        id: parent => parent.id,
        name: parent => parent.name,
        balance: parent => parent.balance
    },
    Bet: {
        id: parent => parent.id,
        userId: parent => parent.userId,
        betAmount: parent => parent.betAmount,
        chance: parent => parent.chance,
        payout: parent => parent.payout,
        win: parent => parent.win
    }
};

const server = new GraphQLServer({
    typeDefs,
    resolvers
});
server.start(() => console.log(`Server is running on http://localhost:4000`));