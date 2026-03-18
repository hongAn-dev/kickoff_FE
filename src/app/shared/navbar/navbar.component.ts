import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-indigo-700 shadow-lg">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-end">
        <div class="flex gap-1">
          <a routerLink="/tasks" routerLinkActive="bg-indigo-900"
            class="px-4 py-2 rounded-lg text-white font-medium hover:bg-indigo-600 transition-colors duration-200">
             Tasks
          </a>
          <a routerLink="/users" routerLinkActive="bg-indigo-900"
            class="px-4 py-2 rounded-lg text-white font-medium hover:bg-indigo-600 transition-colors duration-200">
             Users
          </a>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {}
