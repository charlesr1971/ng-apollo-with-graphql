import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from "./app-routing.module";
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { GraphQLModule } from "./graphql.module";
import { HttpClientModule } from "@angular/common/http";
import { FindComponent } from "./find/find.component";

import { PayoutFormatPipe } from './pipes/payout-format/payout-format.pipe';
import { NoCommaPipe } from './pipes/no-comma/no-comma.pipe';


@NgModule({
  declarations: [AppComponent, HomeComponent, FindComponent, PayoutFormatPipe, NoCommaPipe],
  imports: [
    BrowserModule,
    AppRoutingModule,
    GraphQLModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {provide: LocationStrategy, useClass: PathLocationStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
