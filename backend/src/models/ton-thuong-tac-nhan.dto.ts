export class CreateTonThuongTacNhanDto {
  ten: string;
  nhom?: string | null;
  ghi_chu?: string | null;
}

export class UpdateTonThuongTacNhanDto {
  ten?: string;
  nhom?: string | null;
  ghi_chu?: string | null;
}
