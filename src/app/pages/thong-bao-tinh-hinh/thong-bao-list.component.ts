import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThongBaoTinhHinhService } from '../../core/services/thong-bao-tinh-hinh.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ThongBaoTinhHinh, ThongBaoExcelDto, AuditLog, ThongBaoDetailResponse } from '../../core/models/thong-bao.model';

@Component({
  selector: 'app-thong-bao-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './thong-bao-list.component.html',
  styleUrl: './thong-bao-list.component.css'
})
export class ThongBaoListComponent implements OnInit {
  private thongBaoService = inject(ThongBaoTinhHinhService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // States
  dataList: ThongBaoTinhHinh[] = [];
  isLoading = false;
  isDrawerOpen = false;
  isImportDrawerOpen = false;
  isAuditDrawerOpen = false;
  isViewDrawerOpen = false;
  isEditing = false;
  selectedId: string | number | null = null;

  // Local mapping for Units (matches SignupComponent and Backend DataSeeder)
  donViList = [
    { id: 1, name: 'Cấp Cục / Lãnh Đạo' },
    { id: 10, name: 'Đơn vị Hải Quan Cửa Khẩu' },
    { id: 20, name: 'Đơn vị Cảnh Sát Biển' }
  ];

  // Form & Import Data
  thongBaoForm: FormGroup;
  selectedFiles: FileList | null = null;
  importPreviewData: ThongBaoExcelDto[] | null = null;
  auditLogs: AuditLog[] = [];
  auditedItem: ThongBaoTinhHinh | null = null;
  viewingItem: ThongBaoTinhHinh | null = null;
  viewingDetail: ThongBaoDetailResponse | null = null;
  existingFiles: any[] = [];
  removeFileIds: string[] = [];

  // Pagination & Filter
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  tieuDeSearch = '';
  get searchQuery() { return this.tieuDeSearch; }
  set searchQuery(val) { this.tieuDeSearch = val; }
  phanLoaiIdSearch: number | string = '';

  // Advanced Search Filters
  fromDateSearch = '';
  toDateSearch = '';
  donViIdSearch: number | string = '';
  phamViSearch = '';
  isAdvancedSearchVisible = false;

  // Role Flags
  userRole: string | null = null;
  userDonViId: number | null = null;
  currentUserId: number | null = null;
  
  isCBCT = false;
  isTruongPhong = false;
  isThuTruong = false;
  userMap: Map<number, string> = new Map();

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
    this.userRole = this.authService.getUserRole();
    this.userDonViId = this.authService.getDonViId();
    this.currentUserId = this.authService.getUserId();
    
    this.isCBCT = this.userRole === 'CBCT' || this.userRole === 'ROLE_CBCT' || this.userRole === 'CBTC' || this.userRole === 'ROLE_CBTC';
    this.isTruongPhong = this.userRole === 'TRUONG_PHONG' || this.userRole === 'ROLE_TRUONG_PHONG';
    this.isThuTruong = this.userRole === 'THU_TRUONG' || this.userRole === 'ROLE_THU_TRUONG';

    this.loadUsers();
    this.loadData();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        users.forEach(u => this.userMap.set(Number(u.id), u.name));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  canEdit(item: ThongBaoTinhHinh): boolean {
    return (this.isCBCT || this.isTruongPhong) && (Number(item.donViId) === Number(this.userDonViId) || item.createdBy == this.currentUserId);
  }

  canDelete(item: ThongBaoTinhHinh): boolean {
    return (this.isCBCT || this.isTruongPhong) && (Number(item.donViId) === Number(this.userDonViId) || item.createdBy == this.currentUserId);
  }

  toggleAdvancedSearch(): void {
    this.isAdvancedSearchVisible = !this.isAdvancedSearchVisible;
    if (!this.isAdvancedSearchVisible) {
      this.resetAdvancedSearch();
    }
  }

  resetAdvancedSearch(): void {
    this.fromDateSearch = '';
    this.toDateSearch = '';
    this.donViIdSearch = '';
    this.phamViSearch = '';
    this.onSearch();
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
    this.isLoading = true;
    this.cdr.detectChanges();

    this.thongBaoService.getById(item.id!).subscribe({
      next: (detail: any) => {
        this.ngZone.run(() => {
          console.log('>>> DEBUG: getById response:', detail);

          // Normalize: ensure we have a structure with data and files
          if (detail) {
            // Case 1: Backend returns { data: { ... }, files: [ ... ] } (ThongBaoDetailResponse)
            // Case 2: Backend returns { id: ..., tieuDe: ..., files: [ ... ] } (Flattened with files)
            // Case 3: Backend returns { id: ..., tieuDe: ... } (Raw Entity, no files)

            const isFlattened = !detail.data && (detail.tieuDe || detail.tieu_de || detail.id);

            if (isFlattened) {
              this.viewingDetail = {
                data: {
                  ...detail,
                  tieuDe: detail.tieuDe || detail.tieu_de,
                  phanLoaiId: detail.phanLoaiId || detail.phan_loai_id,
                  phamVi: detail.phamVi || detail.pham_vi,
                  ngayThongBao: detail.ngayThongBao || detail.ngay_thong_bao,
                  noiDung: detail.noiDung || detail.noi_dung,
                  ghiChu: detail.ghiChu || detail.ghi_chu,
                  createdBy: detail.createdBy || detail.created_by,
                  donViId: detail.donViId || detail.don_vi_id
                },
                creatorName: detail.creatorName || detail.creator_name || 'N/A',
                donViName: detail.donViName || detail.don_vi_name || 'N/A',
                files: detail.files || detail.attachments || detail.thongBaoFiles || []
              };
            } else {
              // It already has a .data property
              this.viewingDetail = {
                ...detail,
                // Ensure files are picked up even if nested differently
                files: detail.files || detail.attachments || detail.thongBaoFiles || (detail.data ? (detail.data.files || detail.data.attachments || []) : [])
              };
            }
          }

          console.log('>>> DEBUG: normalized viewingDetail:', this.viewingDetail);

          // Dynamic Name Mapping (Frontend Fallback)
          const detailObj = this.viewingDetail;
          if (detailObj) {
            // 1. Map Unit Name from local list
            const donViId = detailObj.data?.donViId || detailObj.donViId;
            if (donViId && (!detailObj.donViName || detailObj.donViName === 'N/A')) {
              const unit = this.donViList.find(u => u.id === Number(donViId));
              if (unit) detailObj.donViName = unit.name;
            }

            // 2. Fetch Creator Name from UserService
            const createdBy = detailObj.data?.createdBy || detailObj.createdBy;
            if (createdBy && (!detailObj.creatorName || detailObj.creatorName === 'N/A')) {
              this.userService.getById(Number(createdBy)).subscribe({
                next: (user) => {
                  this.ngZone.run(() => {
                    if (this.viewingDetail) {
                      this.viewingDetail.creatorName = user.name;
                      this.cdr.detectChanges();
                    }
                  });
                },
                error: () => {
                  this.ngZone.run(() => {
                    if (this.viewingDetail) {
                      this.viewingDetail.creatorName = 'Người dùng #' + createdBy;
                      this.cdr.detectChanges();
                    }
                  });
                }
              });
            }
          }

          this.isViewDrawerOpen = true;
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error fetching detail:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    const phanLoai = this.phanLoaiIdSearch ? Number(this.phanLoaiIdSearch) : undefined;
    const donViIdSearchVal = this.donViIdSearch ? Number(this.donViIdSearch) : undefined;

    this.thongBaoService.getList(
      this.tieuDeSearch, 
      phanLoai, 
      this.page, 
      this.size,
      this.fromDateSearch || undefined,
      this.toDateSearch || undefined,
      donViIdSearchVal,
      this.phamViSearch || undefined
    ).subscribe({
      next: (res) => {
        this.dataList = (res.content || []).map(item => {
          const creatorName = this.userMap.get(Number(item.createdBy));
          const unit = this.donViList.find(u => u.id === Number(item.donViId));
          return {
            ...item,
            creatorName: creatorName || 'Người dùng #' + item.createdBy,
            donViName: unit ? unit.name : 'Đơn vị #' + item.donViId
          };
        });
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
  openCreate(): void {
    this.onAdd();
  }

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
    this.removeFileIds = [];
    this.isLoading = true;

    this.thongBaoService.getById(item.id!).subscribe({
      next: (detail: any) => {
        this.existingFiles = detail.files || detail.attachments || detail.thongBaoFiles || (detail.data ? (detail.data.files || detail.data.attachments || []) : []);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

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
    this.cdr.detectChanges();
  }

  removeSelectedFile(): void {
    this.selectedFiles = null;
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    console.log('Submitting form...', this.thongBaoForm.value);
    if (this.thongBaoForm.invalid) {
      console.warn('Form is invalid:', this.thongBaoForm.errors);
      this.thongBaoForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const data = {
      ...this.thongBaoForm.value,
      removeFileIds: this.isEditing ? this.removeFileIds : []
    };
    this.isLoading = true;
    this.cdr.detectChanges();

    const request$ = this.isEditing && this.selectedId
      ? this.thongBaoService.update(this.selectedId, data, this.selectedFiles || undefined)
      : this.thongBaoService.create(data, this.selectedFiles || undefined);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.selectedFiles = null; // Clear files after success
        this.resetDrawers();
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Save error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        if (err.status === 403) {
          alert('Bạn không có quyền thực hiện thao tác này!');
        } else {
          alert('Có lỗi xảy ra khi lưu dữ liệu!');
        }
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
        this.ngZone.run(() => {
          this.auditLogs = (logs || []).map(log => ({
            ...log,
            actorName: this.userMap.get(Number(log.changedBy)) || 'Người dùng #' + log.changedBy
          }));
          this.isLoading = false;
          this.cdr.detectChanges();
        });
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
          if (err.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này!');
          } else {
            alert('Không thể xóa bản ghi này!');
          }
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

  onRemoveExistingFile(fileId: string): void {
    this.existingFiles = this.existingFiles.filter(f => f.id !== fileId);
    if (!this.removeFileIds.includes(fileId)) {
      this.removeFileIds.push(fileId);
    }
    this.cdr.detectChanges();
  }

  onDownloadFile(file: any): void {
    if (!file.id) return;
    this.thongBaoService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName || 'download';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download error:', err);
        alert('Không thể tải file!');
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

    const validRows = this.importPreviewData.filter(r => r.isValid);
    const totalRows = this.importPreviewData.length;

    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ để import. Vui lòng kiểm tra lại file!');
      return;
    }

    if (validRows.length < totalRows) {
      const confirmMsg = `Phát hiện ${totalRows - validRows.length} dòng không hợp lệ. Bạn có muốn tiếp tục import ${validRows.length} dòng hợp lệ không?`;
      if (!confirm(confirmMsg)) return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.thongBaoService.importCommit(validRows).subscribe({
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
