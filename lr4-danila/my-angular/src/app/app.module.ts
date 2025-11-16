import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {SignInComponent} from './signin.component';
import { HttpClientModule } from '@angular/common/http'; 
import {BaseComponent} from './base.component';
import {HomeComponent} from "./home.component";
import {FriendsComponent} from "./friends.component";
import {ChatComponent} from "./chat.component";
import {MessagesComponent} from "./messages.component";
import { RegistrationComponent } from './registration.component';
import { FindFriendsComponent } from './findFriends.component';

const appRoutes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: SignInComponent},
  {path: 'friends', component: FriendsComponent},
  {path: 'chat/:id', component: ChatComponent},
  {path: 'messages', component: MessagesComponent},
  {path: 'registration', component: RegistrationComponent},
  {path: 'findFriends', component: FindFriendsComponent}
];

@NgModule({
  declarations: [SignInComponent, BaseComponent, HomeComponent, FriendsComponent, ChatComponent, MessagesComponent, RegistrationComponent,
    FindFriendsComponent],
  imports: [BrowserModule, RouterModule.forRoot(appRoutes), ReactiveFormsModule,
    HttpClientModule, FormsModule
  ],
  bootstrap: [BaseComponent]
})

export class AppModule { }