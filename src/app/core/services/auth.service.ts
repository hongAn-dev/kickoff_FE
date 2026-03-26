import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JwtResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: string;
  donViId: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<ApiResponse<JwtResponse>> {
    return this.http.post<ApiResponse<JwtResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.data && response.data.token) {
          this.saveAuthData(response.data);
        }
      })
    );
  }

  register(user: { name: string; email: string; password: string; role: string; donViId: number }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/register`, user);
  }

  saveAuthData(data: JwtResponse) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_name', data.name);
      localStorage.setItem('user_role', data.role);
      localStorage.setItem('user_donViId', data.donViId.toString());
      localStorage.setItem('user_id', data.id.toString());
    }
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_donViId');
      localStorage.removeItem('user_id');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getUserRole(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('user_role');
    }
    return null;
  }

  getDonViId(): number | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const id = localStorage.getItem('user_donViId');
      return id ? Number(id) : null;
    }
    return null;
  }

  getUserId(): number | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const id = localStorage.getItem('user_id');
      return id ? Number(id) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
