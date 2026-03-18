import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { Task, TaskFilter, TaskPriority, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  users: User[] = [];
  loading = false;
  showModal = false;
  editingTask: Task | null = null;
  errorMsg = '';
  successMsg = '';

  taskForm: FormGroup;

  statusOptions: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'OVERDUE'];
  priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

  filterStatus: string = '';
  filterPriority: string = '';

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: ['TODO', Validators.required],
      priority: ['MEDIUM', Validators.required],
      dueDate: [''],
      userId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadTasks();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({ 
      next: (data: User[]) => {
        this.users = data;
        this.cdr.markForCheck();
      }
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.markForCheck();
    
    const filter: TaskFilter = {
      status: (this.filterStatus as TaskStatus) || undefined,
      priority: (this.filterPriority as TaskPriority) || undefined,
    };
    this.taskService.getAll(filter).subscribe({
      next: (data: Task[]) => {
        this.tasks = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Không thể tải danh sách task.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.loadTasks();
  }

  resetFilter(): void {
    this.filterStatus = '';
    this.filterPriority = '';
    this.loadTasks();
  }

  openCreate(): void {
    this.editingTask = null;
    this.taskForm.reset({ status: 'TODO', priority: 'MEDIUM' });
    this.showModal = true;
    this.errorMsg = '';
  }

  openEdit(task: Task): void {
    this.editingTask = task;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      userId: task.userId,
    });
    this.showModal = true;
    this.errorMsg = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTask = null;
    this.taskForm.reset({ status: 'TODO', priority: 'MEDIUM' });
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    
    const formValue = this.taskForm.value as {
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: string;
      userId: string;
    };

    if (this.editingTask?.id) {
      const updateRequest: UpdateTaskRequest = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        dueDate: formValue.dueDate,
      };
      this.taskService.update(this.editingTask.id, updateRequest).subscribe({
        next: () => {
          this.showSuccess('Cập nhật task thành công!');
          this.closeModal();
          this.loadTasks();
        },
        error: () => (this.errorMsg = 'Cập nhật thất bại.'),
      });
    } else {
      const createRequest: CreateTaskRequest = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        dueDate: formValue.dueDate,
        userId: +formValue.userId,
      };
      this.taskService.create(createRequest).subscribe({
        next: () => {
          this.showSuccess('Tạo task thành công!');
          this.closeModal();
          this.loadTasks();
        },
        error: () => (this.errorMsg = 'Tạo task thất bại.'),
      });
    }
  }

  deleteTask(task: Task): void {
    if (!confirm(`Xóa task "${task.title}"?`)) return;
    this.taskService.delete(task.id!).subscribe({
      next: () => {
        this.showSuccess('Xóa task thành công!');
        this.loadTasks();
      },
      error: () => (this.errorMsg = 'Xóa thất bại.'),
    });
  }

  getStatusClass(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      TODO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
      DONE: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
      OVERDUE: 'bg-red-100 text-red-700 border-red-200',
    };
    return map[status] ?? '';
  }

  getPriorityClass(priority: TaskPriority): string {
    const map: Record<TaskPriority, string> = {
      LOW: 'bg-slate-100 text-slate-600 border-slate-200',
      MEDIUM: 'bg-orange-100 text-orange-700 border-orange-200',
      HIGH: 'bg-red-100 text-red-700 border-red-200',
    };
    return map[priority] ?? '';
  }

  getUserName(userId: number): string {
    return this.users.find((u) => u.id === userId)?.name ?? `User #${userId}`;
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = ''), 3000);
  }

  get f() {
    return this.taskForm.controls;
  }
}
