import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
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
    // Устанавливаем максимальную дату (сегодня - 13 лет)
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    this.maxBirthDate = minAgeDate.toISOString().split('T')[0];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (file) {
      // Проверяем тип файла
      if (!file.type.match('image/jpeg')) {
        this.fileError = 'Пожалуйста, выберите файл в формате JPG';
        this.selectedFile = null;
        this.avatarPreview = null;
        return;
      }

      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'Размер файла не должен превышать 5MB';
        this.selectedFile = null;
        this.avatarPreview = null;
        return;
      }

      this.selectedFile = file;
      this.fileError = '';

      // Создаем preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    this.selectedFile = null;
    this.avatarPreview = null;
    this.fileInput.nativeElement.value = '';
  }

  async onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.fileError = '';

    try {
      // Сначала регистрируем пользователя
      const newUser = await this.userService.register(this.user).toPromise();
      
      // Если есть выбранный файл, загружаем аватарку
      if (this.selectedFile && newUser) {
        const imageData = await this.convertFileToBase64(this.selectedFile);
        await this.userService.uploadAvatar(newUser.id, imageData).toPromise();
      }

      this.isLoading = false;
      alert('Регистрация успешна!');
      this.router.navigate(['/news']);
      
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.error?.error || 'Ошибка регистрации';
      console.error('Registration failed', error);
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
