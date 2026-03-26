import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ThongBaoTinhHinh, ThongBaoExcelDto, PaginatedResponse, AuditLog, ThongBaoDetailResponse } from '../../core/models/thong-bao.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ThongBaoTinhHinhService {
  private apiUrl = `${environment.apiUrl}/api/thong-bao-tinh-hinh`;
  private http = inject(HttpClient);

  getList(keyword?: string, phanLoaiId?: any, page: number = 0, size: number = 10): Observable<PaginatedResponse<ThongBaoTinhHinh>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }
    if (phanLoaiId !== undefined && phanLoaiId !== null && phanLoaiId !== '') {
      params = params.set('phanLoaiId', phanLoaiId.toString());
    }

    return this.http.get<ApiResponse<PaginatedResponse<ThongBaoTinhHinh>>>(this.apiUrl, { params })
      .pipe(map(res => res.data));
  }

  create(data: any, files?: FileList): Observable<ThongBaoTinhHinh> {
    const formData = new FormData();
    // Ensure numeric values are numbers
    const payload = {
      ...data,
      phanLoaiId: Number(data.phanLoaiId)
    };

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'data.json');

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
    }

    return this.http.post<ApiResponse<ThongBaoTinhHinh>>(this.apiUrl, formData)
      .pipe(map(res => res.data));
  }

  update(id: number | string, data: any, files?: FileList): Observable<ThongBaoTinhHinh> {
    const formData = new FormData();
    // Ensure numeric values are numbers, not strings from the select
    const payload = {
      ...data,
      phanLoaiId: Number(data.phanLoaiId)
    };

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'data.json');

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
    }

    return this.http.put<ApiResponse<ThongBaoTinhHinh>>(`${this.apiUrl}/${id}`, formData)
      .pipe(map(res => res.data));
  }

  getById(id: string | number): Observable<ThongBaoDetailResponse> {
    return this.http.get<ApiResponse<ThongBaoDetailResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getAuditLogs(id: number | string): Observable<AuditLog[]> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.apiUrl}/${id}/audit-logs`)
      .pipe(map(res => res.data));
  }

  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }

  importPreview(file: File): Observable<ThongBaoExcelDto[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ThongBaoExcelDto[]>>(`${this.apiUrl}/import/preview`, formData)
      .pipe(map(res => res.data));
  }

  importCommit(data: ThongBaoExcelDto[]): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/import/commit`, data)
      .pipe(map(res => res.data));
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/attachments/${fileId}`, { responseType: 'blob' });
  }
}
