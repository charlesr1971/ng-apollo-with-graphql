const { GraphQLServer, PubSub } = require("graphql-yoga");

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

    type Counter {
        id: Int!
        payoutCount: Float!
        betAmountCount: Float!
    }

    type Query {
        users: [User!]
        user(id: Int!): User!
        bets: [Bet!]
        bet(id: Int!): Bet!
        counters: [Counter!]
        counter(id: Int!): Counter!
    }

    type Subscription {
        counterSubscription(id: Int!, payoutCount: Float!, betAmountCount: Float!): Counter
    }

    type Mutation {
        createBet(userId: Int!, betAmount: Float!, chance: Float!, payout: Float!, win: Int!): Bet!
        updateUser(id: Int!, name: String!, balance: Float!): User!
        deleteBet(id: Int!): Bet!
        updateCounter(id: Int!, payoutCount: Float!, betAmountCount: Float!): Counter!
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


const counters = [{
    id: 1,
    payoutCount: 0,
    betAmountCount: 0
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
        bet: (root, args, context, info) => bets.find(e => e.id === args.id),
        counters: function (root, args, context, info) {
            return counters;
        },
        counter: (root, args, context, info) => counters.find(e => e.id === args.id)
    },
    Subscription: {
        counterSubscription: {
            subscribe: (parent, args, { pubsub }) => {
                //const channel = Math.random().toString(36).substring(2, 15);
                const channel = 'updateCounterSubscription';
                //setInterval(() => pubsub.publish(channel, { counter: { payoutCount: args.payoutCount, betAmountCount: args.betAmountCount  } }), 2000);
                //pubsub.publish(channel, { counter: { payoutCount: 0, betAmountCount: 0  } });
                return pubsub.asyncIterator(channel);
            },
        }
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
            routine, which uses the Array.prototype.splice()
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
            users.splice(index,1,updatedUser);
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

        },
        updateCounter: (_, { id, payoutCount, betAmountCount }, context, info) => {
    
            /* const updatedCounter = {
                payoutCount: payoutCount !== undefined ? payoutCount : 0,
                betAmountCount: betAmountCount !== undefined ? betAmountCount : 0
            }
                    
            counters.splice(0,1,updatedCounter);
            context.pubsub.publish("updateCounterSubscription",updatedCounter)
            return updatedCounter; */

            let updatedCounter;
            var index = 0;
            counters.map( (counter, idx) => {
                if (counter.id === id) {
                    index = idx;
                    updatedCounter = {
                        id: counter.id,
                        payoutCount: payoutCount !== undefined ? payoutCount : counter.payoutCount,
                        betAmountCount: betAmountCount !== undefined ? betAmountCount : counter.betAmountCount 
                    }
                    return updatedCounter;
                } 
                else {
                    return counter
                }
            });
            counters.splice(index,1,updatedCounter);
            context.pubsub.publish("updateCounterSubscription",{counterSubscription: updatedCounter});
            console.log('graphql-yoga: updateCounter(): updatedCounter: ',updatedCounter,' id: ',id,' payoutCount: ',payoutCount,' betAmountCount: ',betAmountCount);
            return updatedCounter;
    
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
    },
    Counter: {
        id: parent => parent.id,
        payoutCount: parent => parent.payoutCount,
        betAmountCount: parent => parent.betAmountCount
    }
};

const pubsub = new PubSub();

const server = new GraphQLServer({
    typeDefs,
    resolvers,
    context: { pubsub }
});

//server.start(() => console.log(`Server is running on http://localhost:4000`));

const options = {
    port: 4000,
    subscriptions: '/subscriptions',
}
  
server.start(options, ({ port }) =>
    console.log(
      `Server started, listening on port ${port} for incoming requests.`,
    ),
)