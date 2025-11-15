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
import { GlobalErrorHandler } from './services/global-error-handler';

// ✅ Правильное определение routes с типом Routes
const routes: Routes = [
  { path: 'register', component: RegistrationComponent },
  { path: 'news', component: NewsFeedComponent },
  { path: 'add-news', component: AddNewsComponent },
  { path: '', redirectTo: '/news', pathMatch: 'full' as const }
];

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    RegistrationComponent,
    NewsFeedComponent,
    AddNewsComponent
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
