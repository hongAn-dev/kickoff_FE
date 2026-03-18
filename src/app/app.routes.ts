import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/user-list/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./pages/task-list/task-list.component').then((m) => m.TaskListComponent),
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./pages/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
  },
  { path: '**', redirectTo: 'users' },
];
