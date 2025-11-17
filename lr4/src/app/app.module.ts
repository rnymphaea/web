import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { NewsFeedComponent } from './components/news-feed/news-feed.component';
import { AddNewsComponent } from './components/add-news/add-news.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { FriendListComponent } from './components/friend-list/friend-list.component';
import { MessageChatComponent } from './components/message-chat/message-chat.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { GlobalErrorHandler } from './services/global-error-handler';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'news', component: NewsFeedComponent },
  { path: 'add-news', component: AddNewsComponent },
  { path: 'friends', component: FriendListComponent },
  { path: 'messages/:friendId', component: MessageChatComponent },
  { path: 'edit-profile', component: EditProfileComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    RegistrationComponent,
    NewsFeedComponent,
    AddNewsComponent,
    LoginComponent,
    HomeComponent,
    FriendListComponent,
    MessageChatComponent,
    EditProfileComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
