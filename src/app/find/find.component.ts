import { Component, OnInit } from "@angular/core";
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

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.monitorFormValueChanges();
    this.getUser();
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
        //if(this.debug) {
          console.log('id: ',id);
        //}
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
              name 
              balance 
            }
          }
          
        `
      })
      .subscribe(({ data, loading }) => {
        this.users = data && data.users;
        this.loading = loading;
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
        if (data.bet) this.bet = data.bet;
        else this.error = "Bet does not exist";
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
        this.bets = data && data.bets;
        this.loading = loading;
      },
      error => {
        this.loading = false;
        this.error = error;
      });

  }

  getBetsPerUser(limit: number):void {

    const users: any = this.getUserList();

    users.map( (user) => {

      this.error = "";
      this.loading = true;
      this.apollo
        .query<any>({
          query: gql`
            query($id: Int!) {
              bet(id: $id) {
                userId 
                betAmount 
                chance 
                payout 
                win  
              }
            }
          `,
          variables: {
            userId: user.id
          }
        })
        .subscribe(({ data, loading }) => {
          if(data.bet){ 
            const obj = {
              userid: user.id,
              data: data.bet
            }
            this.betsPerUser.push(obj);
          }
          else{
            this.error = "Bet does not exist";
          }
          this.loading = loading;
        });

      });

  }


}
