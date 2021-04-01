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

            /*********************************************
             
            there is a bug in GraphQL that throws an error:

            https://github.com/strapi/strapi/issues/2816
            
            "message": "Assignment to constant variable."

            The error is caused by the fact that GraphQL
            thinks that the Array.prototype.map() method 
            is a mutable operation.

            The routine commented out below is the most
            efficient way to remove an item from an immutable
            array. However, due to this bug, the second
            routine, which uses the Object.assign()
            method, must be implemented, instead.

            **********************************************/


            /* let updatedUser;
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
            return updatedUser; */

            let updatedUser;
            var index = 0;
            users.map( (user, idx) => {
                if (user.id === id) {
                    index = idx;
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
            Object.assign([], users, {index: updatedUser});
            return updatedUser;

        },
        deleteBet: (_, { id }, context, info) => {

            /*********************************************
             
            there is a bug in GraphQL that throws an error:

            https://github.com/strapi/strapi/issues/2816
            
            "message": "Assignment to constant variable."

            The error is caused by the fact that GraphQL
            thinks that the Array.prototype.filter() method 
            is a mutable operation.

            The routine commented out below is the most
            efficient way to remove an item from an immutable
            array. However, due to this bug, the second
            routine, which uses the Array.prototype.splice()
            method, must be implemented, instead.

            **********************************************/

            /* const betToDelete = bets.find(x => x.id === id);
            if(betToDelete){
                bets = bets.filter(bet => {
                    return bet.id !== betToDelete.id;
                });
            }
            return betToDelete; */

            const betToDelete = bets.find(x => x.id === id);
            const idx = (bet) => bet.id === id;
            const index = bets.findIndex(idx);
            if(betToDelete && bets.length >= index){
                bets.splice(index,1);
            }
            return betToDelete;

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