import type { NguyenNhanInput } from './phap-tri.dto';

export class DiagnoseBenhDongYExcelDto {
  chi_so?: Record<string, number | string | null | undefined>;
}

export type InputChiSo = Record<string, number | string>;

export class CreateBenhDongYExcelDto {
  code: string;
  name: string;
  outputCell: string;
  excelFormula: string;
  logicExpression: string;
  sqlCaseText: string;
  sqlCaseBoolean: string;
  id_phap_tri_list?: number[];
  id_trieu_chung_list?: number[];
  id_bai_thuoc_list?: number[];
  /** Nguyên nhân có cấu trúc theo nhóm (tinh-than | sinh-hoat | tang-phu). */
  nguyen_nhan_list?: NguyenNhanInput[];
}

export class UpdateBenhDongYExcelDto {
  code?: string;
  name?: string;
  outputCell?: string;
  excelFormula?: string;
  logicExpression?: string;
  sqlCaseText?: string;
  sqlCaseBoolean?: string;
  id_phap_tri_list?: number[];
  id_trieu_chung_list?: number[];
  id_bai_thuoc_list?: number[];
  nguyen_nhan_list?: NguyenNhanInput[];
}
