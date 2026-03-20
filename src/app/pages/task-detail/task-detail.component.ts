import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { Task } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './task-detail.component.html',
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  user: User | null = null;
  loading = true;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.taskService.getById(id).subscribe({
      next: (task) => {
        this.task = task;
        this.loading = false;
        if (task.userId) {
          this.userService.getById(task.userId).subscribe({
            next: (u) => (this.user = u),
          });
        }
      },
      error: () => {
        this.errorMsg = 'Không tìm thấy task này.';
        this.loading = false;
      },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      TODO: 'bg-slate-50 text-slate-500 border-slate-100',
      IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
      DONE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      CANCELLED: 'bg-slate-100 text-slate-400 border-slate-200',
      OVERDUE: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return map[status] ?? '';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'bg-slate-50 text-slate-400 border-slate-100',
      MEDIUM: 'bg-blue-50 text-blue-500 border-blue-100',
      HIGH: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return map[priority] ?? '';
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
