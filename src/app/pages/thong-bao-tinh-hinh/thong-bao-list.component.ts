import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThongBaoTinhHinhService } from '../../core/services/thong-bao-tinh-hinh.service';
import { ThongBaoTinhHinh, ThongBaoExcelDto, AuditLog } from '../../core/models/thong-bao.model';

@Component({
  selector: 'app-thong-bao-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './thong-bao-list.component.html',
  styleUrl: './thong-bao-list.component.css'
})
export class ThongBaoListComponent implements OnInit {
  private thongBaoService = inject(ThongBaoTinhHinhService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // States
  dataList: ThongBaoTinhHinh[] = [];
  isLoading = false;
  isDrawerOpen = false;
  isImportDrawerOpen = false;
  isAuditDrawerOpen = false;
  isViewDrawerOpen = false;
  isEditing = false;
  selectedId: string | number | null = null;

  // Form & Import Data
  thongBaoForm: FormGroup;
  selectedFiles: FileList | null = null;
  importPreviewData: ThongBaoExcelDto[] | null = null;
  auditLogs: AuditLog[] = [];
  auditedItem: ThongBaoTinhHinh | null = null;
  viewingItem: ThongBaoTinhHinh | null = null;

  // Pagination & Filter
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  
  tieuDeSearch = '';
  phanLoaiIdSearch: number | string = '';

  constructor() {
    this.thongBaoForm = this.fb.group({
      tieuDe: ['', [Validators.required, Validators.minLength(5)]],
      noiDung: ['', [Validators.required]],
      phanLoaiId: [1, [Validators.required]],
      phamVi: ['NOI_BO_CUC', [Validators.required]],
      ngayThongBao: [new Date().toISOString().split('T')[0], [Validators.required]],
      ghiChu: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  resetDrawers(): void {
    this.isDrawerOpen = false;
    this.isImportDrawerOpen = false;
    this.isAuditDrawerOpen = false;
    this.isViewDrawerOpen = false;
    this.cdr.detectChanges();
  }

  onView(item: ThongBaoTinhHinh): void {
    this.resetDrawers();
    this.viewingItem = item;
    this.isViewDrawerOpen = true;
    this.cdr.detectChanges();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    const phanLoai = this.phanLoaiIdSearch ? Number(this.phanLoaiIdSearch) : undefined;
    
    this.thongBaoService.getList(this.tieuDeSearch, phanLoai, this.page, this.size)
      .subscribe({
        next: (res) => {
          this.dataList = res.content || [];
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching data:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(): void {
    this.page = 0;
    this.loadData();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadData();
    }
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i);
  }

  // Drawer Actions
  onAdd(): void {
    this.resetDrawers();
    this.isEditing = false;
    this.thongBaoForm.reset({
      phanLoaiId: 1,
      phamVi: 'NOI_BO_CUC',
      ngayThongBao: new Date().toISOString().split('T')[0]
    });
    this.isDrawerOpen = true;
    this.cdr.detectChanges();
  }

  onEdit(item: ThongBaoTinhHinh): void {
    this.resetDrawers();
    this.isEditing = true;
    this.selectedId = item.id || null;
    this.thongBaoForm.patchValue({
      tieuDe: item.tieuDe,
      noiDung: item.noiDung,
      phanLoaiId: item.phanLoaiId,
      phamVi: item.phamVi,
      ngayThongBao: item.ngayThongBao,
      ghiChu: item.ghiChu
    });
    this.isDrawerOpen = true;
    this.cdr.detectChanges();
  }

  onFileChange(event: any): void {
    this.selectedFiles = event.target.files;
  }

  onSubmit(): void {
    if (this.thongBaoForm.invalid) {
      this.thongBaoForm.markAllAsTouched();
      return;
    }

    const data = this.thongBaoForm.value;
    this.isLoading = true;
    this.cdr.detectChanges();

    const request$ = this.isEditing && this.selectedId
      ? this.thongBaoService.update(this.selectedId, data, this.selectedFiles || undefined)
      : this.thongBaoService.create(data, this.selectedFiles || undefined);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.resetDrawers();
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Save error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Có lỗi xảy ra khi lưu dữ liệu!');
      }
    });
  }

  onViewAuditLog(item: ThongBaoTinhHinh): void {
    this.resetDrawers();
    this.auditedItem = item;
    this.isLoading = true;
    this.isAuditDrawerOpen = true;
    this.cdr.detectChanges();
    
    this.thongBaoService.getAuditLogs(item.id!).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDelete(id: number | string): void {
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      this.isLoading = true;
      this.cdr.detectChanges();
      this.thongBaoService.delete(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
          alert('Không thể xóa bản ghi này!');
        }
      });
    }
  }

  onExport(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.thongBaoService.exportExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Danh-Sach-Thong-Bao-${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Export error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Lỗi khi xuất file Excel!');
      }
    });
  }

  triggerImport(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileImportSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.resetDrawers();
    this.isLoading = true;
    this.cdr.detectChanges();
    
    console.log('Starting Import Preview for file:', file.name);

    this.thongBaoService.importPreview(file).subscribe({
      next: (data) => {
        console.log('Import Preview Result:', data);
        this.importPreviewData = data;
        this.isImportDrawerOpen = true;
        this.isLoading = false;
        this.cdr.detectChanges();
        event.target.value = ''; // Reset input
      },
      error: (err) => {
        console.error('Preview error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Dữ liệu file không hợp lệ hoặc sai định dạng!');
      }
    });
  }

  onConfirmImport(): void {
    if (!this.importPreviewData || this.importPreviewData.length === 0) return;

    this.isLoading = true;
    this.cdr.detectChanges();
    this.thongBaoService.importCommit(this.importPreviewData).subscribe({
      next: () => {
        this.isLoading = false;
        this.isImportDrawerOpen = false;
        this.importPreviewData = null;
        this.loadData();
        this.cdr.detectChanges();
        alert('Import dữ liệu thành công!');
      },
      error: (err) => {
        console.error('Commit error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Lỗi khi lưu dữ liệu Import!');
      }
    });
  }
}
