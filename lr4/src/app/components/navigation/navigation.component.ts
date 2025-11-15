import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  isAdmin(): boolean {
    return this.userService.canAccessAdmin();
  }

  logout() {
    this.userService.logout();
    window.location.reload();
  }
}
