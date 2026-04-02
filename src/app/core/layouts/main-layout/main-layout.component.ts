import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  public router = inject(Router);

  currentUrl = '';
  globalSearchText = '';
  activeComponent: any;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects;
    });
    this.currentUrl = this.router.url;
  }

  get searchPlaceholder(): string {
    if (this.currentUrl.includes('users')) return 'Tìm kiếm quân nhân...';
    return 'Tìm kiếm thông báo, đơn vị hoặc mã ID...';
  }

  get actionBtnText(): string {
    if (this.currentUrl.includes('users')) return 'Thêm nhân sự mới';
    return 'Tạo thông báo';
  }

  onActivate(componentRef: any) {
    this.activeComponent = componentRef;
    if (this.activeComponent) {
      this.globalSearchText = this.activeComponent.searchQuery || '';
    }
  }

  onGlobalSearch() {
    if (this.activeComponent) {
      this.activeComponent.searchQuery = this.globalSearchText;
      if (typeof this.activeComponent.onSearch === 'function') {
        this.activeComponent.onSearch();
      } else if (typeof this.activeComponent.loadNotifications === 'function') {
        this.activeComponent.loadNotifications();
      }
    }
  }

  onGlobalAction() {
    if (this.activeComponent) {
      if (typeof this.activeComponent.openCreate === 'function') {
        this.activeComponent.openCreate();
      } else if (typeof this.activeComponent.openAddDrawer === 'function') {
        this.activeComponent.openAddDrawer();
      }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
