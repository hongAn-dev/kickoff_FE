import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: '',
    loadComponent: () => 
      import('./core/layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'thong-bao-tinh-hinh', pathMatch: 'full' },
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
        path: 'thong-bao-tinh-hinh',
        loadComponent: () =>
          import('./pages/thong-bao-tinh-hinh/thong-bao-list.component').then((m) => m.ThongBaoListComponent),
      },
      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./pages/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
      }
    ]
  },
  { path: '**', redirectTo: 'users' },
];
