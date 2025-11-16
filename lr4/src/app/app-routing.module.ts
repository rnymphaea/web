import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistrationComponent } from './components/registration/registration.component';
import { NewsFeedComponent } from './components/news-feed/news-feed.component';
import { AddNewsComponent } from './components/add-news/add-news.component';
import { FriendListComponent } from './components/friend-list/friend-list.component';
import { MessageChatComponent } from './components/message-chat/message-chat.component';

const routes: Routes = [
  { path: 'register', component: RegistrationComponent },
  { path: 'news', component: NewsFeedComponent },
  { path: 'add-news', component: AddNewsComponent },
  { path: 'friends', component: FriendListComponent },
  { path: 'messages/:friendId', component: MessageChatComponent },
  { path: '', redirectTo: '/news', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
