import { Component, OnInit } from "@angular/core";
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Apollo } from "apollo-angular";
import gql from "graphql-tag";

import { User } from '../models/user/user.model';
import { Bet } from '../models/bet/bet.model';

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

  formData = {};
  findForm: FormGroup;
  findUserIdInput: FormControl;

  userId: number = 1;
  user: User;
  users: Array<User>;
  betId: number = 1;
  bet: Bet;
  bets: Array<Bet>;
  betsPerUser: any;
  loading = false;
  error: string;

  constructor(private apollo: Apollo) {
    this.userFinished.next(false);
    this.usersFinished.next(false);
    this.betFinished.next(false);
    this.betsFinished.next(false);
    this.betsPerUserFinished.next(false);
  }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.monitorFormValueChanges();
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

  private createForm(): void {
    this.findForm = new FormGroup({
      findUserIdInput: this.findUserIdInput
    });
  }

  private createFormControls(): void {
    this.findUserIdInput = new FormControl('', [
      Validators.required
    ]);
  }

  private monitorFormValueChanges(): void {
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
        this.formData['userId'] = id;
        this.userId = parseInt(id);
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
        if(this.debug) {
          console.log('FindComponent.component: getBetList(): data.bets: ',data.bets);
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


}
