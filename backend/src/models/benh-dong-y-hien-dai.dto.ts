export class DiagnoseBenhDongYHienDaiDto {
  chi_so?: Record<string, number | string | null | undefined>;
}

export type InputChiSo = Record<string, number | string>;

export class CreateBenhDongYHienDaiDto {
  code: string;
  name: string;
  outputCell: string;
  excelFormula: string;
  logicExpression: string;
  sqlCaseText: string;
  sqlCaseBoolean: string;
}

export class UpdateBenhDongYHienDaiDto {
  code?: string;
  name?: string;
  outputCell?: string;
  excelFormula?: string;
  logicExpression?: string;
  sqlCaseText?: string;
  sqlCaseBoolean?: string;
}
