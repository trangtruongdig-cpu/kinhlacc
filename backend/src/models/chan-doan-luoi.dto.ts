export interface CreateChanDoanLuoiDto {
  idBenhNhan?: number | null;
  ngayKham?: string;
  mauChat?: string;
  hinhDang?: string;
  doAm?: string;
  mauReu?: string;
  tinhChatReu?: string;
  phanBoReu?: string;
  vungBatThuong?: string;
  ketQuaDongY?: string;
  ghiChu?: string;
}

export type UpdateChanDoanLuoiDto = Partial<CreateChanDoanLuoiDto>;
