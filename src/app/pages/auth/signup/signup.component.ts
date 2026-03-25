import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  // Real list of units mapped to Backend DataSeeder
  donViList = [
    { id: 1, name: 'Cấp Cục / Lãnh Đạo (ID: 1)' },
    { id: 10, name: 'Đơn vị Hải Quan Cửa Khẩu (ID: 10)' },
    { id: 20, name: 'Đơn vị Cảnh Sát Biển (ID: 20)' }
  ];

  // Official Roles from Backend
  roleList = [
    { id: 'ROLE_CBCT', name: 'Cán Bộ Chuyên Trách (Quản lý Đơn vị)' },
    { id: 'ROLE_TRUONG_PHONG', name: 'Trưởng Phòng (Xem toàn bộ)' },
    { id: 'ROLE_THU_TRUONG', name: 'Thủ Trưởng (Xem toàn bộ)' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      donViId: [10, Validators.required], // Default to CBCT unit
      role: ['ROLE_CBCT', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      termsAgreed: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    // Payload perfectly matches SignupRequest.java
    const payload = this.signupForm.value;

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.';
      }
    });
  }
}
