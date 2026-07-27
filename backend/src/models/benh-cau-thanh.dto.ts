export class CreateBenhCauThanhDto {
  compound_id: number;
  component_id: number;
  thu_tu?: number;
  ghi_chu?: string | null;
}

export class UpdateBenhCauThanhDto {
  compound_id?: number;
  component_id?: number;
  thu_tu?: number;
  ghi_chu?: string | null;
}
