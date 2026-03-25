import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isSidebarCollapsed = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onLogout(): void {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
