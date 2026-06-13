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
}
