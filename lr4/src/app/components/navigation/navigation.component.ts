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

  openAdminPanel() {
    const adminUrl = 'https://localhost:3001';
    
    fetch(adminUrl, { 
      method: 'HEAD',
      mode: 'no-cors'
    })
    .then(() => {
      window.open(adminUrl, '_blank');
    })
    .catch((error) => {
      console.log('HTTPS admin panel not available, trying HTTP...');
      const fallbackUrl = '/admin-panel';
      window.open(fallbackUrl, '_blank');
    });
  }

  logout() {
    this.userService.logout();
  }
}
