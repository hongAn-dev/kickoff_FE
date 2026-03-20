import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { Task, TaskFilter, TaskPriority, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
      dueTime: [''],
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
    document.body.classList.add('modal-open');
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
      dueTime: task.dueTime || '',
      userId: task.userId,
    });
    this.showModal = true;
    document.body.classList.add('modal-open');
    this.errorMsg = '';
  }

  closeModal(): void {
    this.showModal = false;
    document.body.classList.remove('modal-open');
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
      dueTime: string;
      userId: string;
    };

    if (this.editingTask?.id) {
      const updateRequest: UpdateTaskRequest = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        dueDate: formValue.dueDate,
        dueTime: formValue.dueTime,
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
        dueTime: formValue.dueTime,
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
      TODO: 'bg-slate-50 text-slate-500 border-slate-100',
      IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
      DONE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      CANCELLED: 'bg-slate-100 text-slate-400 border-slate-200',
      OVERDUE: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return map[status] ?? '';
  }

  getPriorityClass(priority: TaskPriority): string {
    const map: Record<TaskPriority, string> = {
      LOW: 'bg-slate-50 text-slate-400 border-slate-100',
      MEDIUM: 'bg-blue-50 text-blue-500 border-blue-100',
      HIGH: 'bg-amber-50 text-amber-600 border-amber-100',
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
