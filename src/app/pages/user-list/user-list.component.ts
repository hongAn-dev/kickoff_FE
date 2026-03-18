import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  showModal = false;
  editingUser: User | null = null;
  errorMsg = '';
  successMsg = '';

  userForm: FormGroup;
  roles = ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER'];

  private routerSub?: Subscription;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['DEVELOPER', Validators.required],
    });
  }

  ngOnInit(): void {
    // Load lần đầu
    this.loadUsers();

    // Tải lại mỗi khi điều hướng về trang này (kể cả từ trang khác)
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.startsWith('/users')) {
        this.loadUsers();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.markForCheck();
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Không thể tải danh sách user. Vui lòng thử lại.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openCreate(): void {
    this.editingUser = null;
    this.userForm.reset({ role: 'DEVELOPER' });
    this.showModal = true;
    this.errorMsg = '';
  }

  openEdit(user: User): void {
    this.editingUser = user;
    this.userForm.patchValue({ name: user.name, email: user.email, role: user.role });
    this.showModal = true;
    this.errorMsg = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
    this.userForm.reset({ role: 'DEVELOPER' });
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const payload: User = this.userForm.value;

    if (this.editingUser?.id) {
      this.userService.update(this.editingUser.id, payload).subscribe({
        next: () => {
          this.showSuccess('Cập nhật user thành công!');
          this.closeModal();
          this.loadUsers();
        },
        error: () => (this.errorMsg = 'Cập nhật thất bại. Vui lòng thử lại.'),
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.showSuccess('Tạo user thành công!');
          this.closeModal();
          this.loadUsers();
        },
        error: () => (this.errorMsg = 'Tạo user thất bại. Email có thể đã tồn tại.'),
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`Xóa user "${user.name}"? Hành động này không thể hoàn tác.`)) return;
    this.userService.delete(user.id!).subscribe({
      next: () => {
        this.showSuccess('Xóa user thành công!');
        this.loadUsers();
      },
      error: () => (this.errorMsg = 'Xóa thất bại. User có thể đang có task.'),
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.successMsg = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  get f() {
    return this.userForm.controls;
  }
}
