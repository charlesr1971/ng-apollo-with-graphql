import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { Apollo } from "apollo-angular";
import gql from "graphql-tag";

import { User } from '../models/user/user.model';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {

  users: Array<User>;
  loading = true;
  error: any;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.getUserList();
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
      this.users = data && data.users;
      this.loading = loading;
    },
    error => {
      this.loading = false;
      this.error = error;
    });

  }

}
