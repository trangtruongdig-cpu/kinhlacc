export class BookSlotDto {
  patientId?: number; // Optional cho patient (lấy từ JWT)
  reason?: string;
  notes?: string;
}

export class UpdateSlotDto {
  reason?: string | null;
  notes?: string | null;
}
