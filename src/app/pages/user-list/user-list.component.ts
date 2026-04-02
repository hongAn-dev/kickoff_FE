import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit, OnDestroy {
  allUsers: User[] = [];
  users: User[] = [];
  loading = false;
  showModal = false;
  editingUser: User | null = null;
  errorMsg = '';
  successMsg = '';

  searchQuery = '';
  roleFilter = '';

  userForm: FormGroup;
  roles = ['CBCT', 'TRUONG_PHONG', 'THU_TRUONG'];

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
      role: ['CBCT', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsers();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.urlAfterRedirects && event.urlAfterRedirects.startsWith('/users')) {
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
        this.allUsers = data || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Không thể tải danh sách nhân sự. Vui lòng thử lại.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters(): void {
    this.users = this.allUsers.filter(u => {
      const matchSearch = !this.searchQuery || 
        u.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRole = !this.roleFilter || u.role === this.roleFilter;
      return matchSearch && matchRole;
    });
    this.cdr.markForCheck();
  }

  onSearch(): void {
    this.applyFilters();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  openCreate(): void {
    this.editingUser = null;
    this.userForm.reset({ role: 'CBCT' });
    this.showModal = true;
    document.body.classList.add('modal-open');
    this.errorMsg = '';
  }

  openEdit(user: User): void {
    this.editingUser = user;
    this.userForm.patchValue({ name: user.name, email: user.email, role: user.role });
    this.showModal = true;
    document.body.classList.add('modal-open');
    this.errorMsg = '';
  }

  closeModal(): void {
    this.showModal = false;
    document.body.classList.remove('modal-open');
    this.editingUser = null;
    this.userForm.reset({ role: 'CBCT' });
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const payload: User = this.userForm.value;

    this.loading = true;
    if (this.editingUser?.id) {
      this.userService.update(this.editingUser.id, payload).subscribe({
        next: () => {
          this.showSuccess('Cập nhật thành công!');
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          this.errorMsg = 'Cập nhật thất bại.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.showSuccess('Thêm nhân sự thành công!');
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          this.errorMsg = 'Thêm nhân sự thất bại.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`Xóa nhân sự "${user.name}"? Hành động này không thể hoàn tác.`)) return;
    this.loading = true;
    this.userService.delete(user.id!).subscribe({
      next: () => {
        this.showSuccess('Xóa nhân sự thành công!');
        this.loadUsers();
      },
      error: () => {
        this.errorMsg = 'Xóa thất bại. Nhân sự này có thể đang có dữ liệu liên quan.';
        this.loading = false;
        this.cdr.markForCheck();
      },
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
