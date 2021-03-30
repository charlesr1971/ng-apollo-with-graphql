import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { User } from '../../models/user/user.model';

/**
 * UserService manages our current user
 */

@Injectable()
export class UserService {

  // `currentUser` contains the current user
  currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);

  constructor() {}

  public setCurrentUser(newUser: User): void {
    this.currentUser.next(newUser);
  }

}

export const userServiceInjectables: Array<any> = [
  UserService
];

