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
      TODO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      DOING: 'bg-blue-100 text-blue-700 border-blue-200',
      DONE: 'bg-green-100 text-green-700 border-green-200',
    };
    return map[status] ?? '';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-600 border-slate-200',
      MEDIUM: 'bg-orange-100 text-orange-700 border-orange-200',
      HIGH: 'bg-red-100 text-red-700 border-red-200',
    };
    return map[priority] ?? '';
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
