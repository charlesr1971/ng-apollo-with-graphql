import { Component, OnInit, OnDestroy } from "@angular/core";
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Apollo, QueryRef } from "apollo-angular";
import gql from "graphql-tag";

import { User } from '../models/user/user.model';
import { Bet } from '../models/bet/bet.model';

const createBet = gql`
  mutation createBet(
    $userId: Int!
    $betAmount: Float!
    $chance: Float!
    $payout: Float!
    $win: Int!
  ) {
    createBet(userId: $userId, betAmount: $betAmount, chance: $chance, payout: $payout, win: $win) {
      id
      userId
      betAmount
      chance
      payout
      win
    }
  }
`;

const getBetsQuery = gql`
  {
    bets {
      id
      userId
      betAmount
      chance
      payout
      win
    }
  }
`;

const getBetQuery = gql`
  query($id: Int!) {
    bet(id: $id) {
      id
      userId
      betAmount
      chance
      payout
      win
    }
  }
`;

const updateUser = gql`
  mutation updateUser(
    $id: Int!
    $name: String!
    $balance: Float!
  ) {
    updateUser(id: $id, name: $name, balance: $balance) {
      id
      name
      balance
    }
  }
`;

const getUsersQuery = gql`
  {
    users {
      id
      name
      balance
    }
  }
`;

const getUserQuery = gql`
  query($id: Int!) {
    user(id: $id) {
      id
      name 
      balance 
    }
  }
`;

const deleteBet = gql`
  mutation deleteBet(
    $id: Int!
  ) {
    deleteBet(id: $id) {
      id
      userId
      betAmount
      chance
      payout
      win
    }
  }
`;

const getCountersQuery = gql`
  {
    counters {
      id
      payoutCount
      betAmountCount
    }
  }
`;

const updateCounter = gql`
  mutation updateCounter(
    $id: Int!
    $payoutCount: Float!
    $betAmountCount: Float!
  ) {
    updateCounter(id: $id, payoutCount: $payoutCount, betAmountCount: $betAmountCount) {
      id
      payoutCount
      betAmountCount
    }
  }
`;

const COUNTERS_SUBSCRIPTION = gql`
    subscription counterSubscription(
        $id: Int!
        $payoutCount: Float!
        $betAmountCount: Float!
      ){
      counterSubscription(id: $id, payoutCount: $payoutCount, betAmountCount: $betAmountCount){
        id
        payoutCount
        betAmountCount
      }
    }
`;



@Component({
  selector: "app-find",
  templateUrl: "./find.component.html",
  styleUrls: ["./find.component.css"]
})
export class FindComponent implements OnInit, OnDestroy {

  debug: boolean = false;

  userFinished: Subject<any> = new Subject<any>();
  usersFinished: Subject<any> = new Subject<any>();
  betFinished: Subject<any> = new Subject<any>();
  betsFinished: Subject<any> = new Subject<any>();
  betsPerUserFinished: Subject<any> = new Subject<any>();
  countersFinished: Subject<any> = new Subject<any>();

  findForm: FormGroup;
  findUserIdInput: FormControl;

  createForm: FormGroup;
  createBetAmountInput: FormControl;
  createChanceInput: FormControl;

  userId: number = 1;
  userIdFromRoute: any = 0;
  user: User;
  users: Array<User>;
  betId: number = 1;
  bet: Bet;
  bets: Array<Bet>;
  betsPerUser: any;
  betAmount: number = 0;
  chance: number = 0;
  userIds: string = '';
  defaultBets: any = 
    {
      1: [1],
      2: [2,3],
      3: [0]
    }
  ;
  loading = false;
  error: string;

  formValidationMessage: string = '';

  count: number = 3;
  payoutCount: number = 0;
  betAmountCount: number = 0;
  ws_payoutCount: number = 0;
  ws_betAmountCount: number = 0;
  counters: any = [];


  betsQuery: QueryRef<any>;
  betsQuerySubscription: Subscription;

  _counters: Observable<any>;
  countersQuery: QueryRef<any>;
  countersQuerySubscription: Subscription;

  init: boolean = true;


  constructor(private apollo: Apollo,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location) {

    this.userFinished.next(false);
    this.usersFinished.next(false);
    this.betFinished.next(false);
    this.betsFinished.next(false);
    this.betsPerUserFinished.next(false);
    this.countersFinished.next(false);

    this.userIdFromRoute = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe(params => {
      if(params['browserRefresh']) {
        this.location.replaceState('find/' + this.route.snapshot.paramMap.get('id'));
      }
    });

    if(this.debug) {
      console.log('FindComponent.component: this.userIdFromRoute: ', this.userIdFromRoute);
    } 

    this.parseUserId();

  }

  ngOnInit() {

    this.createFormsControls();
    this.createForms();
    this.monitorFormsValueChanges();
    this.getUser();
    this.getUserList();
    this.getCounterList();

    this.userFinished.subscribe( (finished) => {
      if(finished){
        this.userFinished.next(false);
      }
    });
    this.usersFinished.subscribe( (finished) => {
      if(finished){
        this.userIds = this.getUserIds(this.users);
        this.usersFinished.next(false);
      }
    });
    this.betFinished.subscribe( (finished) => {
      if(finished){
        this.betFinished.next(false);
      }
    });
    this.betsFinished.subscribe( (finished) => {
      if(finished){
        this.betsFinished.next(false);
        this.getBetsPerUser(this.userId);

        if(this.init){
          const data = {
            bets: this.bets
          }
          const countData = this.createCounts(data);
          const payoutCount = countData['payoutCount'];
          const betAmountCount = countData['betAmountCount'];
          this.ws_payoutCount = payoutCount;
          this.ws_betAmountCount = betAmountCount;
          this.init= false;
        }

      }
    });

    this.betsQuery = this.apollo.watchQuery<any>({
      query: getBetsQuery
    })

    this.betsQuerySubscription = this.betsQuery.valueChanges.subscribe(({ data, loading }) => {
      if(this.debug) {
        console.log('FindComponent.component: this.betsQuerySubscription: data: ', data);
      } 
      if(this.bets){

        const countData = this.createCounts(data);
        const payoutCount = countData['payoutCount'];
        const betAmountCount = countData['betAmountCount'];

        this.apollo
        .mutate({
          mutation: updateCounter,
          variables: {
            id: 1,
            payoutCount: parseFloat(payoutCount),
            betAmountCount: parseFloat(betAmountCount)
          },
          update: (store, mutationResult: any) => {
            // Read the data from our cache for this query.
            try{
              const data: any = store.readQuery({
                query: getCountersQuery
              });
              if(this.debug) {
                console.log('FindComponent.component: this.betsQuerySubscription: updateCounter: mutationResult: ', mutationResult,' data: ',data,' this.payoutCount: ',this.payoutCount,' this.betAmountCount: ',this.betAmountCount);
              } 
              // Update the counter from the mutation to the list of counters in the cache.
              Object.assign([], data.counters, {[0]: mutationResult.data.updateCounter});
              // Write the data back to the cache.
              store.writeQuery({
                query: getCountersQuery,
                data
              });
            }
            catch(e){
              
            }
          }
        })
        .subscribe(
          ({ data }) => {
            
          },
          error => {
              console.log("there was an error sending the query", error);
          }
        );

        const params = {
          payoutCount: payoutCount,
          betAmountCount: betAmountCount
        }

        this.subscribeToNewCounters(params);

      }
    });

    const params = {
      payoutCount: 0,
      betAmountCount: 0
    }

    this.subscribeToNewCounters(params);

  }

  createCounts(data: any): any {
    const countData = {
      payoutCount: 0,
      betAmountCount: 0
    };
    if(this.bets){
      const betsPayoutCount = data.bets.filter( (bet: Bet) => {
        return this.isDefault(bet.id,bet.userId) === false;
      });
      const payoutCountArray = [];
      betsPayoutCount.map((bet: Bet) => {
        const sum1 = bet.payout;
        const sum2 = -bet.payout;
        bet.win === 1 ? payoutCountArray.push(sum1) : payoutCountArray.push(sum2);
        return true;
      });
      this.payoutCount = payoutCountArray.reduce((accumulator: number, value: number) => {
        const sum = accumulator + value;
        return sum 
      }, 0);
      const betsBetAmount = data.bets.filter( (bet: Bet) => {
        return this.isDefault(bet.id,bet.userId) === false;
      });
      this.betAmountCount = betsBetAmount.reduce((accumulator: number, bet: Bet) => {
        const acc: any = Number(accumulator);
        const betAmount: any = Number(bet.betAmount);
        const sum1: any = parseFloat(acc + betAmount);
        return sum1
      }, 0);
      if(this.debug) {
        console.log('FindComponent.component: createCounts(): this.payoutCount: ', this.payoutCount,' this.betAmountCount: ',this.betAmountCount);
      } 
      const payoutCount: any = Number(this.payoutCount);
      const betAmountCount: any = Number(this.betAmountCount);
      if(this.debug) {
        console.log('FindComponent.component: createCounts(): updateCounter: payoutCount: ',parseFloat(payoutCount),' betAmountCount: ',parseFloat(betAmountCount));
      }
      countData['payoutCount'] = payoutCount;
      countData['betAmountCount'] = betAmountCount;
    }
    return countData;
  }

  subscribeToNewCounters(params: any): void {
    this.apollo.subscribe({
      query: COUNTERS_SUBSCRIPTION,
      fetchPolicy: "no-cache",
      variables: {
        id: 1,
        payoutCount: params.payoutCount,
        betAmountCount: params.betAmountCount
      }
    })
    .subscribe(({ data }) => {
      //if(this.debug) {
        console.log('FindComponent.component: subscribeToNewCounters(): data: ', data);
      //} 
      if(data && data['counterSubscription']){
        this.ws_payoutCount = data['counterSubscription']['payoutCount'];
        this.ws_betAmountCount = data['counterSubscription']['betAmountCount'];
      }
    },
    (error) => {
      console.log('there was an error sending the query', error);
    });
  }

  private createForms(): void {

    this.findForm = new FormGroup({
      findUserIdInput: this.findUserIdInput
    });
    this.createForm = new FormGroup({
      createBetAmountInput: this.createBetAmountInput,
      createChanceInput: this.createChanceInput
    });

  }

  private createFormsControls(): void {

    this.findUserIdInput = new FormControl('', [
      Validators.required,
      Validators.pattern("^[0-9]*$")
    ]);
    this.createBetAmountInput = new FormControl('', [
      Validators.required,
      Validators.pattern("^[0-9.]*$")
    ]);
    this.createChanceInput = new FormControl('', [
      Validators.required,
      Validators.pattern("^[0-9.]*$")
    ]);

  }

  private monitorFormsValueChanges(): void {

    if(this.findForm) {
      this.findUserIdInput.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(id => {
        // GraphQL Server throws an error if data is not converted to a number
        this.userId = parseInt(id);
      });
    }

    if(this.createForm) {
      this.createBetAmountInput.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(betAmount => {
        this.betAmount = betAmount;
      });
      this.createChanceInput.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(chance => {
        this.chance = chance;
      });
    }

  }

  getUserIds(users: any): string {
    let usersids = [];
    if (users && users.length > 1){
      users.map( (user: User) => {
        usersids.push(user.id);
        return true; 
      });
    }
    return usersids.join(',');
  }

  getUserNames(users: any): Array<User> {
    if (users && users.length > 1)
      return users.reduce((acc, cur) => acc.name + ", " + cur.name);
    else if (users && users.length == 0) return users[0].name;
  }

  getUser(): void {

    this.error = "";
    this.loading = true;

    this.apollo
    .query<any>({
      query: gql`
        query($id: Int!) {
          user(id: $id) {
            id
            name 
            balance 
          }
        }
      `,
      variables: {
        id: this.userId
      }
    })
    .subscribe(({ data, loading }) => {
      if (data.user){
        this.user = data.user;
        const newBalance: any = this.user.balance;
        this.user.balance = parseFloat(newBalance);
        this.getBetList();
        this.userFinished.next(true);
      }
      else{
        this.error = "User does not exist";
      }
      this.loading = loading;
    });

  }

  getUserList(): void {

    this.error = "";
    this.loading = true;

    this.apollo
    .query<any>({
      query: gql`
        {
          users{
            id
            name 
            balance 
          }
        }
        
      `
    })
    .subscribe(({ data, loading }) => {
      if(data){
        this.users = data.users;
        this.usersFinished.next(true);
        this.loading = loading;
      }
      else{
        this.error = "Users do not exist";
      }
    },
    error => {
      this.loading = false;
      this.error = error;
    });

  }

  getBet(): void {

    this.error = "";
    this.loading = true;

    this.apollo
    .query<any>({
      query: gql`
        query($id: Int!) {
          bet(id: $id) {
            id
            userId 
            betAmount 
            chance 
            payout 
            win  
          }
        }
      `,
      variables: {
        id: this.betId
      }
    })
    .subscribe(({ data, loading }) => {
      if (data.bet){
        this.bet =  data.bet;
      }
      else{
        this.error = "Bet does not exist";
      }
      this.loading = loading;
    });

  }

  getBetList(): void {

    this.error = "";
    this.loading = true;

    this.apollo
    .query<any>({
      query: gql`
        {
          bets{
            id
            userId 
            betAmount 
            chance 
            payout 
            win  
          }
        }
      `
    })
    .subscribe(({ data, loading }) => {
      if(data){
        this.bets = data.bets;
        this.betsFinished.next(true);
      }
      else{
        this.error = "Bets do not exist";
      }
      this.loading = loading;
    },
    error => {
      this.loading = false;
      this.error = error;
    });
    
  }

  getBetsPerUser(userid: number = 1):void {
    if(this.bets && this.bets.length > 0){
      this.betsPerUser = this.bets.filter( (bet: Bet, idx: number) => {
        idx === (this.bets.length - 1) ? this.betsPerUserFinished.next(true) : this.betsPerUserFinished.next(false);
        return bet.userId == userid;
      });
    }
  }

  getCounterList(): void {

    this.error = "";
    this.loading = true;

    this.apollo
    .query<any>({
      query: gql`
        {
          counters{
            id
            payoutCount
            betAmountCount
          }
        }
      `
    })
    .subscribe(({ data, loading }) => {
      if(data){
        this.counters = data.counters;
        this.countersFinished.next(true);
      }
      else{
        this.error = "Counters do not exist";
      }
      this.loading = loading;
    },
    error => {
      this.loading = false;
      this.error = error;
    });
    
  }

  _createBet(): void {

    if(isNaN(this.chance) || this.chance == 0){
      this.chance = 1;
    }

    const integerPattern1: any = new RegExp('^[0-9.]+$','igm');
    const integerPattern2: any = new RegExp('^[0-9.]+$','igm');
    const isValidBetAmount: boolean = integerPattern1.test(this.betAmount);
    const isValidChance: boolean = integerPattern2.test(this.chance);
    const isValid = isValidChance && isValidBetAmount ? true : false;

    if(isValid){

      // GraphQL Server throws an error if bet data is not converted to a number

      const betAmount: any = Number(this.betAmount);
      const chance: any = Number(this.chance);
      this.betAmount = parseFloat(betAmount);
      this.chance = parseFloat(chance);
      const payout: any = this.betAmount * (1/this.chance);
      const win = Math.round(Math.random());
      const balance: number = Number(this.user.balance);

      let newBalance: any = win === 0 ? (balance - payout) : (balance + payout);
      newBalance = parseFloat(newBalance);

      this.user.balance = newBalance;

      this.apollo
      .mutate({
        mutation: createBet,
        variables: {
          id: this.count++,
          userId: this.userId,
          betAmount: this.betAmount,
          chance: this.chance,
          payout: payout,
          win: win
        },
        update: (store, mutationResult: any) => {
          // Read the data from our cache for this query.
          try{
            const data: any = store.readQuery({
              query: getBetsQuery
            });
            // Add the bet from the mutation to the list of bets in the cache.
            data.bets = [...data.bets, mutationResult.data.createBet];
            // Write the data back to the cache.
            store.writeQuery({
              query: getBetsQuery,
              data
            });
          }
          catch(e){

          }
        }
      })
      .subscribe(
        ({ data }) => {
          this.getBetList();
        },
        error => {
          console.log("there was an error sending the query", error);
        }
      );

      this.apollo
      .mutate({
        mutation: updateUser,
        variables: {
          id: this.userId,
          name: this.user.name,
          balance: newBalance
        },
        update: (store, mutationResult: any) => {
          // Read the data from our cache for this query.
          try{
            const data: any = store.readQuery({
              query: getUsersQuery
            });
            // Update the user from the mutation to the list of users in the cache.
            let index = 0;
            const user = data.users.filter( (user, idx: number) => {
              if(user.id === this.userId){
                index = idx;
              }
              return user.id === this.userId;
            })
            if(this.debug) {
              console.log('FindComponent.component: _createBet(): updateUser: mutationResult: ', mutationResult);
            } 
            Object.assign([], data.users, {[index]: mutationResult.data.updateUser});
            // Write the data back to the cache.
            store.writeQuery({
              query: getUsersQuery,
              data
            });
          }
          catch(e){
            
          }
        }
      })
      .subscribe(
        ({ data }) => {
          this.getUserList();
        },
        error => {
            console.log("there was an error sending the query", error);
        }
      );

    }
    else{
      this.formValidationMessage = 'Please make sure the Bet Amount and Chance fields are both integers or floats';
    }

  }

  _deleteBet(id: number): void {

    const _bets = this.bets.filter( (bet, idx: number) => {
      return bet.id === id;
    });

    let _bet: any = null;
    if(_bets.length === 1){
      _bet = _bets[0];
    }

    this.apollo
    .mutate({
      mutation: deleteBet,
      variables: {
        id: id
      },
      update: (store, mutationResult: any) => {
        // Read the data from our cache for this query.
        try{
          const data: any = store.readQuery({
            query: getBetsQuery
          });
          const bets = data.bets.filter( (bet, idx: number) => {
            return bet.id !== id;
          })
          // Delete the bet from the mutation to the list of bets in the cache.
          data.bets = [...bets];
          // Write the data back to the cache.
          store.writeQuery({
            query: getBetsQuery,
            data
          });
        }
        catch(e){
          
        }
      }
    })
    .subscribe(
      ({ data }) => {
        this.getBetList();
      },
      error => {
        console.log("there was an error sending the query", error);
      }
    );

    if(_bet){

      const payout: any = Number(_bet.payout);
      const balance: number = Number(this.user.balance);
      let newBalance: any = _bet.win === 0 ? (balance + payout) : (balance - payout);
      newBalance = parseFloat(newBalance);

      this.user.balance = newBalance;

      this.apollo
      .mutate({
        mutation: updateUser,
        variables: {
          id: this.userId,
          name: this.user.name,
          balance: newBalance
        },
        update: (store, mutationResult: any) => {
          // Read the data from our cache for this query.
          try{
            const data: any = store.readQuery({
              query: getUsersQuery
            });
            // Update the user from the mutation to the list of users in the cache.
            let index = 0;
            const user = data.users.filter( (user, idx: number) => {
              if(user.id === this.userId){
                index = idx;
              }
              return user.id === this.userId;
            })
            Object.assign([], data.users, {[index]: mutationResult.data.updatedUser});
            // Write the data back to the cache.
            store.writeQuery({
              query: getUsersQuery,
              data
            });
          }
          catch(e){
            
          }
        }
      })
      .subscribe(
        ({ data }) => {
          this.getUserList();
        },
        error => {
            console.log("there was an error sending the query", error);
        }
      );

    }

  }


  isDefault(betId: number, userId: number): boolean {
    const found = this.defaultBets[userId].find( (id: number) => id === betId);
    const result = found !== undefined ? true : false;
    return result;
  }

  parseUserId():void {
    const userid = this.userIdFromRoute > 0 ? this.userIdFromRoute : this.userId;
    this.userId = userid === 0 ? 1 : parseInt(userid);
  }

  ngOnDestroy() {
    this.betsQuerySubscription.unsubscribe();
  }


}
