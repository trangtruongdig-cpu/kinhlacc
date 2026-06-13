export class PhacDoChuanHuyetLineDto {
  id_huyet: number;
  thu_tu?: number;
  vai_tro_huyet?: string | null;
  phuong_phap_tac_dong?: string | null;
  ghi_chu_ky_thuat?: string | null;
}

export class CreatePhacDoChuanDto {
  ten: string;
  id_ke_thua?: number | null;
  id_benh_dong_y?: number | null;
  ghi_chu?: string | null;
  thu_tu_hien_thi?: number;
  huyet?: PhacDoChuanHuyetLineDto[];
}

export class UpdatePhacDoChuanDto {
  ten?: string;
  id_ke_thua?: number | null;
  id_benh_dong_y?: number | null;
  ghi_chu?: string | null;
  thu_tu_hien_thi?: number;
  huyet?: PhacDoChuanHuyetLineDto[];
}
