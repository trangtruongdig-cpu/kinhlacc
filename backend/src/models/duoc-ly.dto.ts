export class CreateNhomLonDuocLyDto {
  ten_nhom: string;
  mo_ta?: string | null;
  thu_tu?: number;
}

export class UpdateNhomLonDuocLyDto {
  ten_nhom?: string;
  mo_ta?: string | null;
  thu_tu?: number;
}

export class CreateNhomNhoDuocLyDto {
  id_nhom_lon: number;
  ten_nhom: string;
  lieu_luong?: string | null;
  mo_ta?: string | null;
  thu_tu?: number;
  vi_thuoc_ids?: number[];
  chu_tri_ids?: number[];
}

export class UpdateNhomNhoDuocLyDto {
  id_nhom_lon?: number;
  ten_nhom?: string;
  lieu_luong?: string | null;
  mo_ta?: string | null;
  thu_tu?: number;
  vi_thuoc_ids?: number[];
  chu_tri_ids?: number[];
}
