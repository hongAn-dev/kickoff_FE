import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Task, TaskApiResponse, TaskFilter, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/api/tasks`;

  constructor(private http: HttpClient) { }

  getAll(filter?: TaskFilter): Observable<Task[]> {
    let params = new HttpParams();
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.priority) params = params.set('priority', filter.priority);
    return this.http.get<TaskApiResponse<Task[]>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getById(id: number): Observable<Task> {
    return this.http.get<TaskApiResponse<Task>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(request: CreateTaskRequest): Observable<Task> {
    return this.http.post<TaskApiResponse<Task>>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  update(id: number, request: UpdateTaskRequest): Observable<Task> {
    return this.http.put<TaskApiResponse<Task>>(`${this.apiUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
