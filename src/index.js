const { GraphQLServer } = require("graphql-yoga");

let count = 4;

const typeDefs = `

    type User {
        id: Int!
        name: String!
        balance: Float!
    }

    type Bet {
        id: Int!
        userId: Int!
        betAmount: Float!
        chance: Float!
        payout: Float!
        win: Int!
    }

    type Query {
        users: [User!]
        user(id: Int!): User!
        bets: [Bet!]
        bet(id: Int!): Bet!
    }

    type Mutation {
        createBet(userId: Int!, betAmount: Float!, chance: Float!, payout: Float!, win: Int!): Bet!
        updateUser(id: Int!, name: String!, balance: Float!): User!
        deleteBet(id: Int!): Bet!
    }

`;

const users = [{
    id: 1,
    name: "John Morris",
    balance: 7500000
}, {
    id: 2,
    name: "Alan Davies",
    balance: 12500000
}, {
    id: 3,
    name: "Peter Williams",
    balance: 1500000
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
        createBet: (_, { userId, betAmount, chance, payout, win  }, context, info) => {
          const bet = {
            id: count++,
            userId,
            betAmount,
            chance,
            payout,
            win
          };
          bets.push(bet);
          return bet;
        },
        updateUser: (_, { id, name, balance }, context, info) => {
            let updatedUser;
            users = users.map(user => {
                if (user.id === id) {
                    updatedUser = {
                        id: user.id,
                        name: name !== undefined ? name : user.name,
                        balance: balance !== undefined ? balance : user.balance
                    }
                    return updatedUser;
                } 
                else {
                    return user
                }
            });
            return updatedUser;
            /* let updatedUser;
            for(var i = 0; i < users.length; i++){
                const user = users[i];
                if (user.id === id) {
                    updatedUser = {
                        id: user.id,
                        name: name !== undefined ? name : user.name,
                        balance: balance !== undefined ? balance : user.balance
                    }
                    users.push(updatedUser);
                } 
                else {
                    users.push(user);
                }
            } 
            return updatedUser; */
        },
        deleteBet: (_, { id }, context, info) => {
            const betToDelete = bets.find(x => x.id === id);
            if(betToDelete){
                bets = bets.filter(bet => {
                    return bet.id !== betToDelete.id;
                });
            }
            return betToDelete;
            /* let betToDelete;
            for(var i = 0; i < bets.length; i++){
                const bet = bets[i];
                if(bet.id === id){
                    betToDelete = bet;
                }
                else{
                    bets.push(bet);
                }
            }
            return betToDelete; */
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

/* server.start(
    {
        cors: {
            credentials: true,
            origin: ['http://localhost:4200'],
        },
    },
    deets => {
        console.log(
            `Server is now running on port http://localhost:${deets.port}`
        );
    }
); */

/* server.start(
    {
      cors: {
        credentials: true,
        origin: [process.env.FRONTEND_URL],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204
      }
    },
    server => {
      console.log(`Server is running on http://localhost/${server.port}`);
    }
); */