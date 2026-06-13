// DTO cho Vai Trò (phân quyền). Plain TS — project không dùng class-validator.

export interface CreateVaiTroDto {
  ma?: string; // nếu bỏ trống sẽ tự sinh từ `ten`
  ten: string;
  moTa?: string;
  trangCho?: string[];
}

export interface UpdateVaiTroDto {
  ten?: string;
  moTa?: string;
  trangCho?: string[];
}

// ----- Người dùng (tài khoản nhân viên) -----

export interface CreateNguoiDungDto {
  username: string;
  password: string;
  hoTen?: string;
  email?: string;
  vaiTroId: string;
  trangThai?: boolean;
}

export interface UpdateNguoiDungDto {
  hoTen?: string;
  email?: string;
  vaiTroId?: string;
  trangThai?: boolean;
}

export interface DoiMatKhauDto {
  password: string;
}
