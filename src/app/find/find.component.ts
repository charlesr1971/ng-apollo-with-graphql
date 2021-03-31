import { Component, OnInit } from "@angular/core";
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Apollo } from "apollo-angular";
import gql from "graphql-tag";

import { User } from '../models/user/user.model';
import { Bet } from '../models/bet/bet.model';

const createBet = gql`
  mutation CreateBet(
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

const updateUser = gql`
  mutation UpdateUser(
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


/* const updateUser = gql`
  mutation UpdateUser(
    $id: Int!
    $name: String!
    $balance: Float!
  ) {
    updateUser(where: {id: {_eq: $id}}, _set: {name: $name, balance: $balance}) {
      id
      name
      balance
    }
  }
`; */

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
  mutation DeleteBet(
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

@Component({
  selector: "app-find",
  templateUrl: "./find.component.html",
  styleUrls: ["./find.component.css"]
})
export class FindComponent {

  debug: boolean = false;

  userFinished: Subject<any> = new Subject<any>();
  usersFinished: Subject<any> = new Subject<any>();
  betFinished: Subject<any> = new Subject<any>();
  betsFinished: Subject<any> = new Subject<any>();
  betsPerUserFinished: Subject<any> = new Subject<any>();

  findForm: FormGroup;
  findUserIdInput: FormControl;

  createForm: FormGroup;
  createBetAmountInput: FormControl;
  createChanceInput: FormControl;

  userId: number = 1;
  user: User;
  users: Array<User>;
  betId: number = 1;
  bet: Bet;
  bets: Array<Bet>;
  betsPerUser: any;
  betAmount: number = 0;
  chance: number = 0;
  loading = false;
  error: string;

  formValidationMessage: string = '';

  count: number = 3;

  constructor(private apollo: Apollo) {
    this.userFinished.next(false);
    this.usersFinished.next(false);
    this.betFinished.next(false);
    this.betsFinished.next(false);
    this.betsPerUserFinished.next(false);
  }

  ngOnInit() {
    this.createFormsControls();
    this.createForms();
    this.monitorFormsValueChanges();
    this.getUser();

    this.userFinished.subscribe( (finished) => {
      if(this.debug) {
        console.log('FindComponent.component: this.userFinished: finished ',finished);
      }  
      if(finished){
        this.userFinished.next(false);
      }
    });

    this.usersFinished.subscribe( (finished) => {
      if(this.debug) {
        console.log('FindComponent.component: this.usersFinished: finished ',finished);
      }  
      if(finished){
        this.usersFinished.next(false);
      }
    });

    this.betFinished.subscribe( (finished) => {
      if(this.debug) {
        console.log('FindComponent.component: this.betFinished: finished ',finished);
      }  
      if(finished){
        this.betFinished.next(false);
      }
    });

    this.betsFinished.subscribe( (finished) => {
      if(this.debug) {
        console.log('FindComponent.component: this.betsFinished: finished ',finished);
      }  
      if(finished){
        this.betsFinished.next(false);
        this.getBetsPerUser(this.userId);
      }
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
      Validators.pattern("^[0-9]*$")
    ]);
    this.createChanceInput = new FormControl('', [
      Validators.required,
      Validators.pattern("^[0-9]*$")
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
        if(this.debug) {
          console.log('FindComponent.component: monitorFormValueChanges(): id: ',id);
        }
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
        if(this.debug) {
          console.log('FindComponent.component: monitorFormValueChanges(): betAmount: ',betAmount);
        }
        this.betAmount = betAmount;
      });
      this.createChanceInput.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(chance => {
        if(this.debug) {
          console.log('FindComponent.component: monitorFormValueChanges(): chance: ',chance);
        }
        this.chance = chance;
      });
    }
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
          this.user.balance = parseInt(newBalance);
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
          if(this.debug) {
            console.log('FindComponent.component: getBetList(): data.bets: ',data.bets);
          }
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

  createBet(): void {

    //if(this.debug) {
      console.log('FindComponent.component: createBet(): this.betAmount: ',this.betAmount,' this.chance: ',this.chance);
    //}
    const integerPattern1: any = new RegExp('^[0-9]*$','igm');
    const integerPattern2: any = new RegExp('^[0-9]*$','igm');
    const floatPattern: any = new RegExp('^[0-9.]*$','igm');

    const isValidBetAmount: boolean = integerPattern1.test(this.betAmount);

    //if(this.debug) {
      console.log('FindComponent.component: createBet(): isValidBetAmount: ',isValidBetAmount);
    //}

    const isValidChance: boolean = integerPattern2.test(this.chance);

    //if(this.debug) {
      console.log('FindComponent.component: createBet(): isValidChance: ',isValidChance);
    //}

    const isValid = isValidChance && isValidBetAmount ? true : false;

    if(isValid){

      const betAmount: any = Number(this.betAmount);
      const chance: any = Number(this.chance);

      this.betAmount = parseInt(betAmount);
      this.chance = parseInt(chance);

      const payout: any = this.betAmount * (1/this.chance);
      const win = Math.round(Math.random());

      const balance: number = Number(this.user.balance);

      let newBalance: any = win === 0 ? (balance - payout) : (balance + payout);
      newBalance = parseInt(newBalance);

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
            if(this.debug) {
              console.log('FindComponent.component: createBet(): store: ',store,' mutationResult: ',mutationResult);
            }
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
        })
        .subscribe(
          ({ data }) => {
            if(this.debug) {
              console.log('FindComponent.component: createBet(): data: ',data);
            }
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
            if(this.debug) {
              console.log('FindComponent.component: updateUser(): store: ',store,' mutationResult: ',mutationResult);
            }
            const data: any = store.readQuery({
              query: getUsersQuery
            });
            // Add the user from the mutation to the list of users in the cache.
            let index = 0;
            const user = data.users.filter( (user, idx: number) => {
              index = idx;
              return user.id === this.userId;
            })
            //if(this.debug) {
              console.log('FindComponent.component: updateUser(): user: ',user);
            //}
            data.users = [...data.users, mutationResult.data.createUser];
            const newArray = Object.assign([], data.users, {[index]: user});
            data.users = newArray;
            // Write the data back to the cache.
            store.writeQuery({
              query: getUsersQuery,
              data
            });
          }
        })
        .subscribe(
          ({ data }) => {
            if(this.debug) {
              console.log('FindComponent.component: updateUser(): data: ',data);
            }
          },
          error => {
              console.log("there was an error sending the query", error);
          }
        );

    }
    else{
      this.formValidationMessage = 'Please make sure the Bet Amount and Chance fields are both integers';
    }

  }

  delete(id: number): void {

    //if(this.debug) {
      console.log('FindComponent.component: reset(): id: ',id);
    //}

    this.apollo
      .mutate({
        mutation: deleteBet,
        variables: {
          id: id
        },
        update: (store, mutationResult: any) => {
          // Read the data from our cache for this query.
          if(this.debug) {
            console.log('FindComponent.component: reset(): store: ',store,' mutationResult: ',mutationResult);
          }
          const data: any = store.readQuery({
            query: getBetsQuery
          });
          const bets = data.bets.filter( (bet, idx: number) => {
            return bet.id !== id;
          })
          // Add the bet from the mutation to the list of bets in the cache.
          data.bets = [...bets];
          // Write the data back to the cache.
          store.writeQuery({
            query: getBetsQuery,
            data
          });
        }
      })
      .subscribe(
        ({ data }) => {
          if(this.debug) {
            console.log('FindComponent.component: reset(): data: ',data);
          }
          this.getBetList();
        },
        error => {
          console.log("there was an error sending the query", error);
        }
      );

  }


}
