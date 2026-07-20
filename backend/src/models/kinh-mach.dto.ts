export class CreateKinhMachDto {
  ten_kinh_mach: string;
  ten_viet_tat?: string;
  ky_hieu_quoc_te?: string;
  ngu_hanh?: string;
  tong_so_huyet?: number;
  bieu_hien_tac_nghen?: string;
}

export class UpdateKinhMachDto {
  ten_kinh_mach?: string;
  ten_viet_tat?: string;
  ky_hieu_quoc_te?: string;
  ngu_hanh?: string;
  tong_so_huyet?: number;
  bieu_hien_tac_nghen?: string;
}
