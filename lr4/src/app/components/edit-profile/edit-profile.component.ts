import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  user: User | null = null;
  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    birthDate: ''
  };

  selectedFile: File | null = null;
  avatarPreview: string | null = null;
  errorMessage: string = '';
  fileError: string = '';
  isLoading: boolean = false;
  maxBirthDate: string;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    this.maxBirthDate = minAgeDate.toISOString().split('T')[0];
    
    this.userService.getCurrentUser().subscribe(user => {
      if (user) {
        this.user = user;
        this.profileData = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          birthDate: user.birthDate || ''
        };
        this.avatarPreview = this.userService.getAvatarUrl(user.id);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (file) {
      if (!file.type.match('image/jpeg')) {
        this.fileError = 'Пожалуйста, выберите файл в формате JPG';
        this.selectedFile = null;
        this.avatarPreview = null;
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'Размер файла не должен превышать 5MB';
        this.selectedFile = null;
        this.avatarPreview = null;
        return;
      }

      this.selectedFile = file;
      this.fileError = '';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    if (confirm('Вы уверены, что хотите удалить аватарку?')) {
      if (this.user) {
        this.userService.deleteAvatar(this.user.id).subscribe({
          next: () => {
            this.selectedFile = null;
            this.avatarPreview = null;
            this.fileInput.nativeElement.value = '';
            alert('Аватарка удалена');
          },
          error: (error) => {
            console.error('Error deleting avatar:', error);
            alert('Ошибка при удалении аватарки');
          }
        });
      }
    }
  }

  async onSubmit() {
    if (!this.user) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.fileError = '';

    try {
      await this.userService.updateProfile(this.user.id, this.profileData).toPromise();
      
      if (this.selectedFile) {
        const imageData = await this.convertFileToBase64(this.selectedFile);
        await this.userService.uploadAvatar(this.user.id, imageData).toPromise();
      }

      this.isLoading = false;
      alert('Профиль успешно обновлен!');
      this.router.navigate(['/news']);
      
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.error?.error || 'Ошибка обновления профиля';
      console.error('Profile update failed', error);
    }
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        resolve(e.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }
}
