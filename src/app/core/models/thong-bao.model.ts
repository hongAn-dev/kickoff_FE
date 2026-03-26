export interface ThongBaoTinhHinh {
  id: string | number;
  tieuDe: string;
  phanLoaiId: number;
  phamVi: 'NOI_BO_CUC' | 'TOAN_NGANH';
  ngayThongBao: string;
  noiDung: string;
  ghiChu?: string;
  isDeleted?: boolean;
  attachments?: string[];
  createdBy?: string | number;
  donViId?: number;
}

export interface ThongBaoFileDto {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ThongBaoDetailResponse {
  data: ThongBaoTinhHinh;
  creatorName: string;
  donViName: string;
  files: ThongBaoFileDto[];
  createdBy?: string | number;
  donViId?: number;
}

export interface ThongBaoExcelDto {
  rowNumber?: number;
  tieuDe: string;
  phanLoaiId: number;
  phamVi: string;
  ngayThongBao: string;
  noiDung: string;
  ghiChu: string;
  isValid?: boolean;
  errors?: string[];
}

export interface AuditLog {
  id: string; // UUID
  recordId: string; // UUID
  action: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedBy: number;
  changedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}
