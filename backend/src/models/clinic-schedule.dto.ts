export class UpdateClinicScheduleConfigDto {
  openTime?: string;
  closeTime?: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  slotDurationMinutes?: number;
}

export class UpsertClinicDayOverrideDto {
  isClosed?: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  note?: string | null;
}

export class GenerateSlotsDto {
  date: string; // YYYY-MM-DD
  // Khi true, đóng các slot OPEN cũ không còn nằm trong khung giờ mới (vd sau khi thay đổi config).
  // Mặc định false: chỉ thêm slot thiếu, không động đến slot đã tồn tại.
  reconcile?: boolean;
}
