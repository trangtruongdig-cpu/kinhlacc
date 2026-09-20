// TỆP SINH TỰ ĐỘNG — ĐỪNG SỬA TAY.
// Nguồn: frontend/src/lib/nguHanhHoiTac.ts (engine luận Ngũ Hành Hồi Tác).
// Sinh lại: cd frontend && node scripts/nhht-cong-thuc.mjs --xuat
// Muốn đổi một công thức cho riêng phòng chẩn trị thì SỬA TRÊN APP (ghi đè lưu ở DB),
// đổi ở đây là đổi bộ chuẩn cho mọi nơi.

export interface NhhtCongThuc {
  ma: string; kinh: string; hanh: string; trangThai: string; khung: string; khungTen: string;
  kinhBan: string; chiDao: string;
  menhLenh: Array<{ bac: string; tacDong: string; hanh: string; kinh: string; huyet: string | null; vaiTro: string | null; phap: string }>;
  huyetNguDu: { bo: Record<string, unknown>; ta: Record<string, unknown>; giaiThich: string } | null;
  huyetNanKinh: Record<string, unknown> | null;
  huyetNguyenLac: { chuKinh: string; nguyen: { ten: string; ma: string }; khachKinh: string; lac: { ten: string; ma: string }; giaiThich: string } | null;
  phapCoDien: Array<{ id: string; ten: string; han: string; coChe: string; nguon: string }>;
}
export const NHHT_SINH_LUC = '2026-09-19';

export const NHHT_CONG_THUC: NhhtCongThuc[] = [
  {
    "ma": "NHHT-CAN-HU-BIEULY",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Đởm",
    "chiDao": "Can (Mộc) HƯ — khung Biểu–Lý: BỔ Mộc tại Đởm (Túc lâm khấp) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Đởm",
        "huyet": "Túc lâm khấp",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Can",
        "huyet": "Khúc tuyền",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Túc lâm khấp",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Trung phong · kinh Can) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Túc lâm khấp · kinh Đởm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Khúc tuyền",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Khúc tuyền · Hợp huyệt kinh Can) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-HU-THUONGHA",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tâm bào",
    "chiDao": "Can (Mộc) HƯ — khung Thượng–Hạ: BỔ Mộc tại Tâm bào (Trung xung) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Can",
        "huyet": "Khúc tuyền",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Trung xung",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Trung phong · kinh Can) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Trung xung · kinh Tâm bào) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Khúc tuyền",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Khúc tuyền · Hợp huyệt kinh Can) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-HU-PHUTHE",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tỳ",
    "chiDao": "Can (Mộc) HƯ — khung Phu–Thê: BỔ Mộc tại Tỳ (Ẩn bạch) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Can",
        "huyet": "Khúc tuyền",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Trung phong · kinh Can) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Khúc tuyền",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Khúc tuyền · Hợp huyệt kinh Can) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-HU-TYNGO",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tiểu trường",
    "chiDao": "Can (Mộc) HƯ — khung Tý–Ngọ: BỔ Mộc tại Tiểu trường (Hậu khê) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Can",
        "huyet": "Khúc tuyền",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hậu khê",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Trung phong · kinh Can) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Hậu khê · kinh Tiểu trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Khúc tuyền",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Khúc tuyền · Hợp huyệt kinh Can) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-HU-LACKHI",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tam tiêu",
    "chiDao": "Can (Mộc) HƯ — khung Lục Khí: BỔ Mộc tại Tam tiêu (Trung chử) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Can",
        "huyet": "Khúc tuyền",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Trung chử",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Trung phong · kinh Can) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Trung chử · kinh Tam tiêu) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Khúc tuyền",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Khúc tuyền · Hợp huyệt kinh Can) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-THUC-BIEULY",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Đởm",
    "chiDao": "Can (Mộc) THỰC — khung Biểu–Lý: TẢ Mộc tại Đởm (Túc lâm khấp) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Đởm",
        "huyet": "Túc lâm khấp",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Túc lâm khấp",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Trung phong · kinh Can) để chế ngự Mộc; TẢ Mộc (Túc lâm khấp · kinh Đởm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Hành gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Hành gian · Huỳnh huyệt kinh Can) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-THUC-THUONGHA",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tâm bào",
    "chiDao": "Can (Mộc) THỰC — khung Thượng–Hạ: TẢ Mộc tại Tâm bào (Trung xung) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Trung xung",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Trung phong · kinh Can) để chế ngự Mộc; TẢ Mộc (Trung xung · kinh Tâm bào) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Hành gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Hành gian · Huỳnh huyệt kinh Can) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-THUC-PHUTHE",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tỳ",
    "chiDao": "Can (Mộc) THỰC — khung Phu–Thê: TẢ Mộc tại Tỳ (Ẩn bạch) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Trung phong · kinh Can) để chế ngự Mộc; TẢ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Hành gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Hành gian · Huỳnh huyệt kinh Can) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-THUC-TYNGO",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tiểu trường",
    "chiDao": "Can (Mộc) THỰC — khung Tý–Ngọ: TẢ Mộc tại Tiểu trường (Hậu khê) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hậu khê",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Trung phong · kinh Can) để chế ngự Mộc; TẢ Mộc (Hậu khê · kinh Tiểu trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Hành gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Hành gian · Huỳnh huyệt kinh Can) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-CAN-THUC-LACKHI",
    "kinh": "Can",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tam tiêu",
    "chiDao": "Can (Mộc) THỰC — khung Lục Khí: TẢ Mộc tại Tam tiêu (Trung chử) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Can",
        "huyet": "Trung phong",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Trung phong",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Trung chử",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Trung phong · kinh Can) để chế ngự Mộc; TẢ Mộc (Trung chử · kinh Tam tiêu) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Can",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Hành gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Hành gian · Huỳnh huyệt kinh Can) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Can",
      "nguyen": {
        "ten": "Thái xung",
        "ma": "LR3"
      },
      "khachKinh": "Đởm",
      "lac": {
        "ten": "Quang minh",
        "ma": "GB37"
      },
      "giaiThich": "Can là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái xung để vực nguyên khí ngay tại gốc bệnh; Đởm biểu-lý với Can nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Quang minh để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-HU-BIEULY",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tiểu trường",
    "chiDao": "Tâm (Hoả) HƯ — khung Biểu–Lý: BỔ Hoả tại Tiểu trường (Dương cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tiểu trường",
        "huyet": "Dương cốc",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương cốc",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Dương cốc · kinh Tiểu trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thiếu xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Thiếu xung · Tỉnh huyệt kinh Tâm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-HU-THUONGHA",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Thận",
    "chiDao": "Tâm (Hoả) HƯ — khung Thượng–Hạ: BỔ Hoả tại Thận (Nhiên cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Thận",
        "huyet": "Nhiên cốc",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Nhiên cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Nhiên cốc · kinh Thận) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thiếu xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Thiếu xung · Tỉnh huyệt kinh Tâm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-HU-PHUTHE",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Phế",
    "chiDao": "Tâm (Hoả) HƯ — khung Phu–Thê: BỔ Hoả tại Phế (Ngư tế) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Ngư tế · kinh Phế) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thiếu xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Thiếu xung · Tỉnh huyệt kinh Tâm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-HU-TYNGO",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Đởm",
    "chiDao": "Tâm (Hoả) HƯ — khung Tý–Ngọ: BỔ Hoả tại Đởm (Dương phụ) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương phụ",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Dương phụ · kinh Đởm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thiếu xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Thiếu xung · Tỉnh huyệt kinh Tâm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-HU-LACKHI",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Đởm",
    "chiDao": "Tâm (Hoả) HƯ — khung Lục Khí: BỔ Hoả tại Đởm (Dương phụ) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương phụ",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Dương phụ · kinh Đởm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thiếu xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Thiếu xung · Tỉnh huyệt kinh Tâm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-THUC-BIEULY",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tiểu trường",
    "chiDao": "Tâm (Hoả) THỰC — khung Biểu–Lý: TẢ Hoả tại Tiểu trường (Dương cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Tiểu trường",
        "huyet": "Dương cốc",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm",
        "huyet": "Thần môn",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương cốc",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Thiếu hải · kinh Tâm) để chế ngự Hoả; TẢ Hoả (Dương cốc · kinh Tiểu trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thần môn",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thần môn · Du huyệt kinh Tâm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-THUC-THUONGHA",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Thận",
    "chiDao": "Tâm (Hoả) THỰC — khung Thượng–Hạ: TẢ Hoả tại Thận (Nhiên cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Thận",
        "huyet": "Nhiên cốc",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm",
        "huyet": "Thần môn",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Nhiên cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Thiếu hải · kinh Tâm) để chế ngự Hoả; TẢ Hoả (Nhiên cốc · kinh Thận) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thần môn",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thần môn · Du huyệt kinh Tâm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-THUC-PHUTHE",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Phế",
    "chiDao": "Tâm (Hoả) THỰC — khung Phu–Thê: TẢ Hoả tại Phế (Ngư tế) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm",
        "huyet": "Thần môn",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Thiếu hải · kinh Tâm) để chế ngự Hoả; TẢ Hoả (Ngư tế · kinh Phế) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thần môn",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thần môn · Du huyệt kinh Tâm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-THUC-TYNGO",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Đởm",
    "chiDao": "Tâm (Hoả) THỰC — khung Tý–Ngọ: TẢ Hoả tại Đởm (Dương phụ) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm",
        "huyet": "Thần môn",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương phụ",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Thiếu hải · kinh Tâm) để chế ngự Hoả; TẢ Hoả (Dương phụ · kinh Đởm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thần môn",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thần môn · Du huyệt kinh Tâm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAM-THUC-LACKHI",
    "kinh": "Tâm",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Đởm",
    "chiDao": "Tâm (Hoả) THỰC — khung Lục Khí: TẢ Hoả tại Đởm (Dương phụ) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm",
        "huyet": "Thần môn",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương phụ",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Thiếu hải · kinh Tâm) để chế ngự Hoả; TẢ Hoả (Dương phụ · kinh Đởm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thần môn",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thần môn · Du huyệt kinh Tâm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm",
      "nguyen": {
        "ten": "Thần môn",
        "ma": "HT7"
      },
      "khachKinh": "Tiểu trường",
      "lac": {
        "ten": "Chi chính",
        "ma": "SI7"
      },
      "giaiThich": "Tâm là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thần môn để vực nguyên khí ngay tại gốc bệnh; Tiểu trường biểu-lý với Tâm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Chi chính để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-HU-BIEULY",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tam tiêu",
    "chiDao": "Tâm bào (Hoả) HƯ — khung Biểu–Lý: BỔ Hoả tại Tam tiêu (Chi câu) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tam tiêu",
        "huyet": "Chi câu",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Chi câu",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Chi câu · kinh Tam tiêu) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung xung · Tỉnh huyệt kinh Tâm bào) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-HU-THUONGHA",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Can",
    "chiDao": "Tâm bào (Hoả) HƯ — khung Thượng–Hạ: BỔ Hoả tại Can (Hành gian) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Hành gian",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Hành gian · kinh Can) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung xung · Tỉnh huyệt kinh Tâm bào) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-HU-PHUTHE",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Thận",
    "chiDao": "Tâm bào (Hoả) HƯ — khung Phu–Thê: BỔ Hoả tại Thận (Nhiên cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Thận",
        "huyet": "Nhiên cốc",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Nhiên cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Nhiên cốc · kinh Thận) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung xung · Tỉnh huyệt kinh Tâm bào) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-HU-TYNGO",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Vị",
    "chiDao": "Tâm bào (Hoả) HƯ — khung Tý–Ngọ: BỔ Hoả tại Vị (Giải khê) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Giải khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Giải khê · kinh Vị) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung xung · Tỉnh huyệt kinh Tâm bào) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-HU-LACKHI",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Vị",
    "chiDao": "Tâm bào (Hoả) HƯ — khung Lục Khí: BỔ Hoả tại Vị (Giải khê) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm bào",
        "huyet": "Trung xung",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Giải khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Giải khê · kinh Vị) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung xung",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung xung · Tỉnh huyệt kinh Tâm bào) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-THUC-BIEULY",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tam tiêu",
    "chiDao": "Tâm bào (Hoả) THỰC — khung Biểu–Lý: TẢ Hoả tại Tam tiêu (Chi câu) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Tam tiêu",
        "huyet": "Chi câu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Chi câu",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Khúc trạch · kinh Tâm bào) để chế ngự Hoả; TẢ Hoả (Chi câu · kinh Tam tiêu) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Đại lăng",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Đại lăng · Du huyệt kinh Tâm bào) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-THUC-THUONGHA",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Can",
    "chiDao": "Tâm bào (Hoả) THỰC — khung Thượng–Hạ: TẢ Hoả tại Can (Hành gian) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Hành gian",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Khúc trạch · kinh Tâm bào) để chế ngự Hoả; TẢ Hoả (Hành gian · kinh Can) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Đại lăng",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Đại lăng · Du huyệt kinh Tâm bào) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-THUC-PHUTHE",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Thận",
    "chiDao": "Tâm bào (Hoả) THỰC — khung Phu–Thê: TẢ Hoả tại Thận (Nhiên cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Thận",
        "huyet": "Nhiên cốc",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Nhiên cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Khúc trạch · kinh Tâm bào) để chế ngự Hoả; TẢ Hoả (Nhiên cốc · kinh Thận) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Đại lăng",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Đại lăng · Du huyệt kinh Tâm bào) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-THUC-TYNGO",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Vị",
    "chiDao": "Tâm bào (Hoả) THỰC — khung Tý–Ngọ: TẢ Hoả tại Vị (Giải khê) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Giải khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Khúc trạch · kinh Tâm bào) để chế ngự Hoả; TẢ Hoả (Giải khê · kinh Vị) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Đại lăng",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Đại lăng · Du huyệt kinh Tâm bào) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMBAO-THUC-LACKHI",
    "kinh": "Tâm bào",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Vị",
    "chiDao": "Tâm bào (Hoả) THỰC — khung Lục Khí: TẢ Hoả tại Vị (Giải khê) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Giải khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Khúc trạch · kinh Tâm bào) để chế ngự Hoả; TẢ Hoả (Giải khê · kinh Vị) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tâm bào",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Đại lăng",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Đại lăng · Du huyệt kinh Tâm bào) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tâm bào",
      "nguyen": {
        "ten": "Đại lăng",
        "ma": "PC7"
      },
      "khachKinh": "Tam tiêu",
      "lac": {
        "ten": "Ngoại quan",
        "ma": "TE5"
      },
      "giaiThich": "Tâm bào là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Đại lăng để vực nguyên khí ngay tại gốc bệnh; Tam tiêu biểu-lý với Tâm bào nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Ngoại quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TY-HU-BIEULY",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Vị",
    "chiDao": "Tỳ (Thổ) HƯ — khung Biểu–Lý: BỔ Thổ tại Vị (Túc tam lý) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Vị",
        "huyet": "Túc tam lý",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Túc tam lý",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Túc tam lý · kinh Vị) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Đại đô",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Đại đô · Huỳnh huyệt kinh Tỳ) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TY-HU-THUONGHA",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Phế",
    "chiDao": "Tỳ (Thổ) HƯ — khung Thượng–Hạ: BỔ Thổ tại Phế (Thái uyên) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái uyên",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Thái uyên · kinh Phế) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Đại đô",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Đại đô · Huỳnh huyệt kinh Tỳ) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TY-HU-PHUTHE",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Can",
    "chiDao": "Tỳ (Thổ) HƯ — khung Phu–Thê: BỔ Thổ tại Can (Thái xung) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Can",
        "huyet": "Thái xung",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái xung",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Thái xung · kinh Can) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Đại đô",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Đại đô · Huỳnh huyệt kinh Tỳ) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TY-HU-TYNGO",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tam tiêu",
    "chiDao": "Tỳ (Thổ) HƯ — khung Tý–Ngọ: BỔ Thổ tại Tam tiêu (Thiên tỉnh) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thiên tỉnh",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Thiên tỉnh · kinh Tam tiêu) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Đại đô",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Đại đô · Huỳnh huyệt kinh Tỳ) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TY-HU-LACKHI",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Đại trường",
    "chiDao": "Tỳ (Thổ) HƯ — khung Lục Khí: BỔ Thổ tại Đại trường (Khúc trì) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Khúc trì",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Ẩn bạch · kinh Tỳ) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Khúc trì · kinh Đại trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Đại đô",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Đại đô · Huỳnh huyệt kinh Tỳ) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TY-THUC-BIEULY",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Vị",
    "chiDao": "Tỳ (Thổ) THỰC — khung Biểu–Lý: TẢ Thổ tại Vị (Túc tam lý) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Vị",
        "huyet": "Túc tam lý",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Túc tam lý",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Ẩn bạch · kinh Tỳ) để chế ngự Thổ; TẢ Thổ (Túc tam lý · kinh Vị) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Thương khâu",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Thương khâu · Kinh huyệt kinh Tỳ) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TY-THUC-THUONGHA",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Phế",
    "chiDao": "Tỳ (Thổ) THỰC — khung Thượng–Hạ: TẢ Thổ tại Phế (Thái uyên) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái uyên",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Ẩn bạch · kinh Tỳ) để chế ngự Thổ; TẢ Thổ (Thái uyên · kinh Phế) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Thương khâu",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Thương khâu · Kinh huyệt kinh Tỳ) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TY-THUC-PHUTHE",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Can",
    "chiDao": "Tỳ (Thổ) THỰC — khung Phu–Thê: TẢ Thổ tại Can (Thái xung) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Can",
        "huyet": "Thái xung",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái xung",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Ẩn bạch · kinh Tỳ) để chế ngự Thổ; TẢ Thổ (Thái xung · kinh Can) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Thương khâu",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Thương khâu · Kinh huyệt kinh Tỳ) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TY-THUC-TYNGO",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tam tiêu",
    "chiDao": "Tỳ (Thổ) THỰC — khung Tý–Ngọ: TẢ Thổ tại Tam tiêu (Thiên tỉnh) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thiên tỉnh",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Ẩn bạch · kinh Tỳ) để chế ngự Thổ; TẢ Thổ (Thiên tỉnh · kinh Tam tiêu) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Thương khâu",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Thương khâu · Kinh huyệt kinh Tỳ) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TY-THUC-LACKHI",
    "kinh": "Tỳ",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Đại trường",
    "chiDao": "Tỳ (Thổ) THỰC — khung Lục Khí: TẢ Thổ tại Đại trường (Khúc trì) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tỳ",
        "huyet": "Ẩn bạch",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Ẩn bạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Khúc trì",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Ẩn bạch · kinh Tỳ) để chế ngự Thổ; TẢ Thổ (Khúc trì · kinh Đại trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tỳ",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Thương khâu",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Thương khâu · Kinh huyệt kinh Tỳ) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tỳ",
      "nguyen": {
        "ten": "Thái bạch",
        "ma": "SP3"
      },
      "khachKinh": "Vị",
      "lac": {
        "ten": "Phong long",
        "ma": "ST40"
      },
      "giaiThich": "Tỳ là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái bạch để vực nguyên khí ngay tại gốc bệnh; Vị biểu-lý với Tỳ nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phong long để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-HU-BIEULY",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Đại trường",
    "chiDao": "Phế (Kim) HƯ — khung Biểu–Lý: BỔ Kim tại Đại trường (Thương dương) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Đại trường",
        "huyet": "Thương dương",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thương dương",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Ngư tế · kinh Phế) tại Kinh Gốc ngắt đè nén; BỔ Kim (Thương dương · kinh Đại trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thái uyên",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Thái uyên · Du huyệt kinh Phế) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-HU-THUONGHA",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tỳ",
    "chiDao": "Phế (Kim) HƯ — khung Thượng–Hạ: BỔ Kim tại Tỳ (Thương khâu) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thương khâu",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Ngư tế · kinh Phế) tại Kinh Gốc ngắt đè nén; BỔ Kim (Thương khâu · kinh Tỳ) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thái uyên",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Thái uyên · Du huyệt kinh Phế) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-HU-PHUTHE",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tâm",
    "chiDao": "Phế (Kim) HƯ — khung Phu–Thê: BỔ Kim tại Tâm (Linh đạo) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Tâm",
        "huyet": "Linh đạo",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Linh đạo",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Ngư tế · kinh Phế) tại Kinh Gốc ngắt đè nén; BỔ Kim (Linh đạo · kinh Tâm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thái uyên",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Thái uyên · Du huyệt kinh Phế) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-HU-TYNGO",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Bàng quang",
    "chiDao": "Phế (Kim) HƯ — khung Tý–Ngọ: BỔ Kim tại Bàng quang (Chí âm) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Chí âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Ngư tế · kinh Phế) tại Kinh Gốc ngắt đè nén; BỔ Kim (Chí âm · kinh Bàng quang) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thái uyên",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Thái uyên · Du huyệt kinh Phế) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-HU-LACKHI",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Bàng quang",
    "chiDao": "Phế (Kim) HƯ — khung Lục Khí: BỔ Kim tại Bàng quang (Chí âm) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Phế",
        "huyet": "Thái uyên",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Chí âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Ngư tế · kinh Phế) tại Kinh Gốc ngắt đè nén; BỔ Kim (Chí âm · kinh Bàng quang) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thái uyên",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Thái uyên · Du huyệt kinh Phế) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-THUC-BIEULY",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Đại trường",
    "chiDao": "Phế (Kim) THỰC — khung Biểu–Lý: TẢ Kim tại Đại trường (Thương dương) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Đại trường",
        "huyet": "Thương dương",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thương dương",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Ngư tế · kinh Phế) để chế ngự Kim; TẢ Kim (Thương dương · kinh Đại trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Xích trạch",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Xích trạch · Hợp huyệt kinh Phế) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-THUC-THUONGHA",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tỳ",
    "chiDao": "Phế (Kim) THỰC — khung Thượng–Hạ: TẢ Kim tại Tỳ (Thương khâu) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thương khâu",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Ngư tế · kinh Phế) để chế ngự Kim; TẢ Kim (Thương khâu · kinh Tỳ) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Xích trạch",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Xích trạch · Hợp huyệt kinh Phế) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-THUC-PHUTHE",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tâm",
    "chiDao": "Phế (Kim) THỰC — khung Phu–Thê: TẢ Kim tại Tâm (Linh đạo) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tâm",
        "huyet": "Linh đạo",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Linh đạo",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Ngư tế · kinh Phế) để chế ngự Kim; TẢ Kim (Linh đạo · kinh Tâm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Xích trạch",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Xích trạch · Hợp huyệt kinh Phế) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-THUC-TYNGO",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Bàng quang",
    "chiDao": "Phế (Kim) THỰC — khung Tý–Ngọ: TẢ Kim tại Bàng quang (Chí âm) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Chí âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Ngư tế · kinh Phế) để chế ngự Kim; TẢ Kim (Chí âm · kinh Bàng quang) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Xích trạch",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Xích trạch · Hợp huyệt kinh Phế) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-PHE-THUC-LACKHI",
    "kinh": "Phế",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Bàng quang",
    "chiDao": "Phế (Kim) THỰC — khung Lục Khí: TẢ Kim tại Bàng quang (Chí âm) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Phế",
        "huyet": "Ngư tế",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Ngư tế",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Chí âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Ngư tế · kinh Phế) để chế ngự Kim; TẢ Kim (Chí âm · kinh Bàng quang) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Phế",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Xích trạch",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Xích trạch · Hợp huyệt kinh Phế) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Phế",
      "nguyen": {
        "ten": "Thái uyên",
        "ma": "LU9"
      },
      "khachKinh": "Đại trường",
      "lac": {
        "ten": "Thiên lịch",
        "ma": "LI6"
      },
      "giaiThich": "Phế là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái uyên để vực nguyên khí ngay tại gốc bệnh; Đại trường biểu-lý với Phế nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thiên lịch để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-HU-BIEULY",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Bàng quang",
    "chiDao": "Thận (Thuỷ) HƯ — khung Biểu–Lý: BỔ Thuỷ tại Bàng quang (Thông cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Bàng quang",
        "huyet": "Thông cốc",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thông cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Thái khê · kinh Thận) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Thông cốc · kinh Bàng quang) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Phục lưu",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Phục lưu · Kinh huyệt kinh Thận) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-HU-THUONGHA",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tâm",
    "chiDao": "Thận (Thuỷ) HƯ — khung Thượng–Hạ: BỔ Thuỷ tại Tâm (Thiếu hải) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Thái khê · kinh Thận) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Phục lưu",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Phục lưu · Kinh huyệt kinh Thận) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-HU-PHUTHE",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tâm bào",
    "chiDao": "Thận (Thuỷ) HƯ — khung Phu–Thê: BỔ Thuỷ tại Tâm bào (Khúc trạch) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Thái khê · kinh Thận) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Phục lưu",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Phục lưu · Kinh huyệt kinh Thận) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-HU-TYNGO",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Đại trường",
    "chiDao": "Thận (Thuỷ) HƯ — khung Tý–Ngọ: BỔ Thuỷ tại Đại trường (Nhị gian) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Nhị gian",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Thái khê · kinh Thận) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Nhị gian · kinh Đại trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Phục lưu",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Phục lưu · Kinh huyệt kinh Thận) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-HU-LACKHI",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tiểu trường",
    "chiDao": "Thận (Thuỷ) HƯ — khung Lục Khí: BỔ Thuỷ tại Tiểu trường (Tiền cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Thái khê · kinh Thận) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Phục lưu",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Phục lưu · Kinh huyệt kinh Thận) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-THUC-BIEULY",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Bàng quang",
    "chiDao": "Thận (Thuỷ) THỰC — khung Biểu–Lý: TẢ Thuỷ tại Bàng quang (Thông cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Bàng quang",
        "huyet": "Thông cốc",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Thận",
        "huyet": "Dũng tuyền",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thông cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Thái khê · kinh Thận) để chế ngự Thuỷ; TẢ Thuỷ (Thông cốc · kinh Bàng quang) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Dũng tuyền",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Dũng tuyền · Tỉnh huyệt kinh Thận) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-THUC-THUONGHA",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tâm",
    "chiDao": "Thận (Thuỷ) THỰC — khung Thượng–Hạ: TẢ Thuỷ tại Tâm (Thiếu hải) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm",
        "huyet": "Thiếu hải",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Thận",
        "huyet": "Dũng tuyền",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Thiếu hải",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Thái khê · kinh Thận) để chế ngự Thuỷ; TẢ Thuỷ (Thiếu hải · kinh Tâm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Dũng tuyền",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Dũng tuyền · Tỉnh huyệt kinh Thận) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-THUC-PHUTHE",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tâm bào",
    "chiDao": "Thận (Thuỷ) THỰC — khung Phu–Thê: TẢ Thuỷ tại Tâm bào (Khúc trạch) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tâm bào",
        "huyet": "Khúc trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Thận",
        "huyet": "Dũng tuyền",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Khúc trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Thái khê · kinh Thận) để chế ngự Thuỷ; TẢ Thuỷ (Khúc trạch · kinh Tâm bào) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Dũng tuyền",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Dũng tuyền · Tỉnh huyệt kinh Thận) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-THUC-TYNGO",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Đại trường",
    "chiDao": "Thận (Thuỷ) THỰC — khung Tý–Ngọ: TẢ Thuỷ tại Đại trường (Nhị gian) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Thận",
        "huyet": "Dũng tuyền",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Nhị gian",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Thái khê · kinh Thận) để chế ngự Thuỷ; TẢ Thuỷ (Nhị gian · kinh Đại trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Dũng tuyền",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Dũng tuyền · Tỉnh huyệt kinh Thận) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-THAN-THUC-LACKHI",
    "kinh": "Thận",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tiểu trường",
    "chiDao": "Thận (Thuỷ) THỰC — khung Lục Khí: TẢ Thuỷ tại Tiểu trường (Tiền cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Thận",
        "huyet": "Thái khê",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Thận",
        "huyet": "Dũng tuyền",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái khê",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Thái khê · kinh Thận) để chế ngự Thuỷ; TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Thận",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Dũng tuyền",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Dũng tuyền · Tỉnh huyệt kinh Thận) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Thận",
      "nguyen": {
        "ten": "Thái khê",
        "ma": "KI3"
      },
      "khachKinh": "Bàng quang",
      "lac": {
        "ten": "Phi dương",
        "ma": "BL58"
      },
      "giaiThich": "Thận là kinh bệnh TRƯỚC (chủ, tạng (lý)) → lấy huyệt Nguyên Thái khê để vực nguyên khí ngay tại gốc bệnh; Bàng quang biểu-lý với Thận nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Phi dương để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-HU-BIEULY",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Can",
    "chiDao": "Đởm (Mộc) HƯ — khung Biểu–Lý: BỔ Mộc tại Can (Đại đôn) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Can",
        "huyet": "Đại đôn",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Đởm",
        "huyet": "Hiệp khê",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Đại đôn",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Túc khiếu âm · kinh Đởm) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Đại đôn · kinh Can) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Hiệp khê",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Hiệp khê · Huỳnh huyệt kinh Đởm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-HU-THUONGHA",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tam tiêu",
    "chiDao": "Đởm (Mộc) HƯ — khung Thượng–Hạ: BỔ Mộc tại Tam tiêu (Trung chử) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Đởm",
        "huyet": "Hiệp khê",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Trung chử",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Túc khiếu âm · kinh Đởm) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Trung chử · kinh Tam tiêu) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Hiệp khê",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Hiệp khê · Huỳnh huyệt kinh Đởm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-HU-PHUTHE",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Vị",
    "chiDao": "Đởm (Mộc) HƯ — khung Phu–Thê: BỔ Mộc tại Vị (Hãm cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Đởm",
        "huyet": "Hiệp khê",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Túc khiếu âm · kinh Đởm) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Hãm cốc · kinh Vị) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Hiệp khê",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Hiệp khê · Huỳnh huyệt kinh Đởm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-HU-TYNGO",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tâm",
    "chiDao": "Đởm (Mộc) HƯ — khung Tý–Ngọ: BỔ Mộc tại Tâm (Thiếu xung) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Đởm",
        "huyet": "Hiệp khê",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Thiếu xung",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Túc khiếu âm · kinh Đởm) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Thiếu xung · kinh Tâm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Hiệp khê",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Hiệp khê · Huỳnh huyệt kinh Đởm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-HU-LACKHI",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tâm",
    "chiDao": "Đởm (Mộc) HƯ — khung Lục Khí: BỔ Mộc tại Tâm (Thiếu xung) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Đởm",
        "huyet": "Hiệp khê",
        "vaiTro": "Huỳnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Thiếu xung",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc suy HƯ bị Kim Tương Thừa (khắc phạt quá tay) → TẢ Kim (Túc khiếu âm · kinh Đởm) tại Kinh Gốc ngắt đè nén; BỔ Mộc (Thiếu xung · kinh Tâm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Hiệp khê",
      "role": "Huỳnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Mộc suy HƯ → BỔ Thuỷ (Hiệp khê · Huỳnh huyệt kinh Đởm) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "tu-thuy-ham-moc",
        "ten": "Tư thuỷ hàm mộc",
        "han": "滋水涵木",
        "coChe": "Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-THUC-BIEULY",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Can",
    "chiDao": "Đởm (Mộc) THỰC — khung Biểu–Lý: TẢ Mộc tại Can (Đại đôn) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Can",
        "huyet": "Đại đôn",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Đại đôn",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Túc khiếu âm · kinh Đởm) để chế ngự Mộc; TẢ Mộc (Đại đôn · kinh Can) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Dương phụ",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Dương phụ · Kinh huyệt kinh Đởm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-THUC-THUONGHA",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tam tiêu",
    "chiDao": "Đởm (Mộc) THỰC — khung Thượng–Hạ: TẢ Mộc tại Tam tiêu (Trung chử) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Trung chử",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Túc khiếu âm · kinh Đởm) để chế ngự Mộc; TẢ Mộc (Trung chử · kinh Tam tiêu) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Dương phụ",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Dương phụ · Kinh huyệt kinh Đởm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-THUC-PHUTHE",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Vị",
    "chiDao": "Đởm (Mộc) THỰC — khung Phu–Thê: TẢ Mộc tại Vị (Hãm cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Túc khiếu âm · kinh Đởm) để chế ngự Mộc; TẢ Mộc (Hãm cốc · kinh Vị) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Dương phụ",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Dương phụ · Kinh huyệt kinh Đởm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-THUC-TYNGO",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tâm",
    "chiDao": "Đởm (Mộc) THỰC — khung Tý–Ngọ: TẢ Mộc tại Tâm (Thiếu xung) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Thiếu xung",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Túc khiếu âm · kinh Đởm) để chế ngự Mộc; TẢ Mộc (Thiếu xung · kinh Tâm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Dương phụ",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Dương phụ · Kinh huyệt kinh Đởm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DOM-THUC-LACKHI",
    "kinh": "Đởm",
    "hanh": "Mộc",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tâm",
    "chiDao": "Đởm (Mộc) THỰC — khung Lục Khí: TẢ Mộc tại Tâm (Thiếu xung) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Tâm",
        "huyet": "Thiếu xung",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Đởm",
        "huyet": "Túc khiếu âm",
        "vaiTro": "Tỉnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Túc khiếu âm",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Thiếu xung",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Mộc quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Kim) → BỔ Kim (Túc khiếu âm · kinh Đởm) để chế ngự Mộc; TẢ Mộc (Thiếu xung · kinh Tâm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đởm",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Dương phụ",
      "role": "Kinh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Mộc quá THỰC → TẢ Hoả (Dương phụ · Kinh huyệt kinh Đởm) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đởm",
      "nguyen": {
        "ten": "Khâu khư",
        "ma": "GB40"
      },
      "khachKinh": "Can",
      "lac": {
        "ten": "Lãi câu",
        "ma": "LR5"
      },
      "giaiThich": "Đởm là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Khâu khư để vực nguyên khí ngay tại gốc bệnh; Can biểu-lý với Đởm nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Lãi câu để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-kim-binh-moc",
        "ten": "Tá kim bình mộc",
        "han": "佐金平木",
        "coChe": "Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-HU-BIEULY",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tâm",
    "chiDao": "Tiểu trường (Hoả) HƯ — khung Biểu–Lý: BỔ Hoả tại Tâm (Thiếu phủ) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tâm",
        "huyet": "Thiếu phủ",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Thiếu phủ",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Thiếu phủ · kinh Tâm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Hậu khê",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Hậu khê · Du huyệt kinh Tiểu trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-HU-THUONGHA",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Bàng quang",
    "chiDao": "Tiểu trường (Hoả) HƯ — khung Thượng–Hạ: BỔ Hoả tại Bàng quang (Côn lôn) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Bàng quang",
        "huyet": "Côn lôn",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Côn lôn",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Côn lôn · kinh Bàng quang) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Hậu khê",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Hậu khê · Du huyệt kinh Tiểu trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-HU-PHUTHE",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Đại trường",
    "chiDao": "Tiểu trường (Hoả) HƯ — khung Phu–Thê: BỔ Hoả tại Đại trường (Dương khê) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Dương khê · kinh Đại trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Hậu khê",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Hậu khê · Du huyệt kinh Tiểu trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-HU-TYNGO",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Can",
    "chiDao": "Tiểu trường (Hoả) HƯ — khung Tý–Ngọ: BỔ Hoả tại Can (Hành gian) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Hành gian",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Hành gian · kinh Can) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Hậu khê",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Hậu khê · Du huyệt kinh Tiểu trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-HU-LACKHI",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Thận",
    "chiDao": "Tiểu trường (Hoả) HƯ — khung Lục Khí: BỔ Hoả tại Thận (Nhiên cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Thận",
        "huyet": "Nhiên cốc",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tiểu trường",
        "huyet": "Hậu khê",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Nhiên cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Nhiên cốc · kinh Thận) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Hậu khê",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Hậu khê · Du huyệt kinh Tiểu trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-THUC-BIEULY",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tâm",
    "chiDao": "Tiểu trường (Hoả) THỰC — khung Biểu–Lý: TẢ Hoả tại Tâm (Thiếu phủ) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Tâm",
        "huyet": "Thiếu phủ",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tiểu trường",
        "huyet": "Tiểu hải",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Thiếu phủ",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) để chế ngự Hoả; TẢ Hoả (Thiếu phủ · kinh Tâm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Tiểu hải",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Tiểu hải · Hợp huyệt kinh Tiểu trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-THUC-THUONGHA",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Bàng quang",
    "chiDao": "Tiểu trường (Hoả) THỰC — khung Thượng–Hạ: TẢ Hoả tại Bàng quang (Côn lôn) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Bàng quang",
        "huyet": "Côn lôn",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tiểu trường",
        "huyet": "Tiểu hải",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Côn lôn",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) để chế ngự Hoả; TẢ Hoả (Côn lôn · kinh Bàng quang) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Tiểu hải",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Tiểu hải · Hợp huyệt kinh Tiểu trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-THUC-PHUTHE",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Đại trường",
    "chiDao": "Tiểu trường (Hoả) THỰC — khung Phu–Thê: TẢ Hoả tại Đại trường (Dương khê) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tiểu trường",
        "huyet": "Tiểu hải",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) để chế ngự Hoả; TẢ Hoả (Dương khê · kinh Đại trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Tiểu hải",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Tiểu hải · Hợp huyệt kinh Tiểu trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-THUC-TYNGO",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Can",
    "chiDao": "Tiểu trường (Hoả) THỰC — khung Tý–Ngọ: TẢ Hoả tại Can (Hành gian) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tiểu trường",
        "huyet": "Tiểu hải",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Hành gian",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) để chế ngự Hoả; TẢ Hoả (Hành gian · kinh Can) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Tiểu hải",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Tiểu hải · Hợp huyệt kinh Tiểu trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TIEUTRUONG-THUC-LACKHI",
    "kinh": "Tiểu trường",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Thận",
    "chiDao": "Tiểu trường (Hoả) THỰC — khung Lục Khí: TẢ Hoả tại Thận (Nhiên cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Thận",
        "huyet": "Nhiên cốc",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tiểu trường",
        "huyet": "Tiểu hải",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Nhiên cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) để chế ngự Hoả; TẢ Hoả (Nhiên cốc · kinh Thận) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tiểu trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Tiểu hải",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Tiểu hải · Hợp huyệt kinh Tiểu trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tiểu trường",
      "nguyen": {
        "ten": "Uyển cốt",
        "ma": "SI4"
      },
      "khachKinh": "Tâm",
      "lac": {
        "ten": "Thông lý",
        "ma": "HT5"
      },
      "giaiThich": "Tiểu trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Uyển cốt để vực nguyên khí ngay tại gốc bệnh; Tâm biểu-lý với Tiểu trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Thông lý để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-HU-BIEULY",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tâm bào",
    "chiDao": "Tam tiêu (Hoả) HƯ — khung Biểu–Lý: BỔ Hoả tại Tâm bào (Lao cung) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tâm bào",
        "huyet": "Lao cung",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Lao cung",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Lao cung · kinh Tâm bào) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung chử",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung chử · Du huyệt kinh Tam tiêu) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-HU-THUONGHA",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Đởm",
    "chiDao": "Tam tiêu (Hoả) HƯ — khung Thượng–Hạ: BỔ Hoả tại Đởm (Dương phụ) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương phụ",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Dương phụ · kinh Đởm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung chử",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung chử · Du huyệt kinh Tam tiêu) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-HU-PHUTHE",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Bàng quang",
    "chiDao": "Tam tiêu (Hoả) HƯ — khung Phu–Thê: BỔ Hoả tại Bàng quang (Côn lôn) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Bàng quang",
        "huyet": "Côn lôn",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Côn lôn",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Côn lôn · kinh Bàng quang) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung chử",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung chử · Du huyệt kinh Tam tiêu) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-HU-TYNGO",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tỳ",
    "chiDao": "Tam tiêu (Hoả) HƯ — khung Tý–Ngọ: BỔ Hoả tại Tỳ (Đại đô) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Đại đô",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Đại đô · kinh Tỳ) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung chử",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung chử · Du huyệt kinh Tam tiêu) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-HU-LACKHI",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Can",
    "chiDao": "Tam tiêu (Hoả) HƯ — khung Lục Khí: BỔ Hoả tại Can (Hành gian) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Tam tiêu",
        "huyet": "Trung chử",
        "vaiTro": "Du",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Can",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Hành gian",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả suy HƯ bị Thuỷ Tương Thừa (khắc phạt quá tay) → TẢ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Gốc ngắt đè nén; BỔ Hoả (Hành gian · kinh Can) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Trung chử",
      "role": "Du",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Hoả suy HƯ → BỔ Mộc (Trung chử · Du huyệt kinh Tam tiêu) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-THUC-BIEULY",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tâm bào",
    "chiDao": "Tam tiêu (Hoả) THỰC — khung Biểu–Lý: TẢ Hoả tại Tâm bào (Lao cung) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Tâm bào",
        "huyet": "Lao cung",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Lao cung",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Dịch môn · kinh Tam tiêu) để chế ngự Hoả; TẢ Hoả (Lao cung · kinh Tâm bào) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thiên tỉnh",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thiên tỉnh · Hợp huyệt kinh Tam tiêu) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-THUC-THUONGHA",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Đởm",
    "chiDao": "Tam tiêu (Hoả) THỰC — khung Thượng–Hạ: TẢ Hoả tại Đởm (Dương phụ) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đởm",
        "huyet": "Dương phụ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương phụ",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Dịch môn · kinh Tam tiêu) để chế ngự Hoả; TẢ Hoả (Dương phụ · kinh Đởm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thiên tỉnh",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thiên tỉnh · Hợp huyệt kinh Tam tiêu) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-THUC-PHUTHE",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Bàng quang",
    "chiDao": "Tam tiêu (Hoả) THỰC — khung Phu–Thê: TẢ Hoả tại Bàng quang (Côn lôn) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Bàng quang",
        "huyet": "Côn lôn",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Côn lôn",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Dịch môn · kinh Tam tiêu) để chế ngự Hoả; TẢ Hoả (Côn lôn · kinh Bàng quang) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thiên tỉnh",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thiên tỉnh · Hợp huyệt kinh Tam tiêu) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-THUC-TYNGO",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tỳ",
    "chiDao": "Tam tiêu (Hoả) THỰC — khung Tý–Ngọ: TẢ Hoả tại Tỳ (Đại đô) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Tỳ",
        "huyet": "Đại đô",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Đại đô",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Dịch môn · kinh Tam tiêu) để chế ngự Hoả; TẢ Hoả (Đại đô · kinh Tỳ) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thiên tỉnh",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thiên tỉnh · Hợp huyệt kinh Tam tiêu) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-TAMTIEU-THUC-LACKHI",
    "kinh": "Tam tiêu",
    "hanh": "Hoả",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Can",
    "chiDao": "Tam tiêu (Hoả) THỰC — khung Lục Khí: TẢ Hoả tại Can (Hành gian) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Can",
        "huyet": "Hành gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tam tiêu",
        "huyet": "Thiên tỉnh",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Can",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Hành gian",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Hoả quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thuỷ) → BỔ Thuỷ (Dịch môn · kinh Tam tiêu) để chế ngự Hoả; TẢ Hoả (Hành gian · kinh Can) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Tam tiêu",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Thiên tỉnh",
      "role": "Hợp",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Hoả quá THỰC → TẢ Thổ (Thiên tỉnh · Hợp huyệt kinh Tam tiêu) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Tam tiêu",
      "nguyen": {
        "ten": "Dương trì",
        "ma": "TE4"
      },
      "khachKinh": "Tâm bào",
      "lac": {
        "ten": "Nội quan",
        "ma": "PC6"
      },
      "giaiThich": "Tam tiêu là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Dương trì để vực nguyên khí ngay tại gốc bệnh; Tâm bào biểu-lý với Tam tiêu nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Nội quan để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ta-nam-bo-bac",
        "ten": "Tả nam bổ bắc",
        "han": "瀉南補北",
        "coChe": "Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.",
        "nguon": "Nạn Kinh 75"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-VI-HU-BIEULY",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tỳ",
    "chiDao": "Vị (Thổ) HƯ — khung Biểu–Lý: BỔ Thổ tại Tỳ (Thái bạch) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Tỳ",
        "huyet": "Thái bạch",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái bạch",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Hãm cốc · kinh Vị) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Thái bạch · kinh Tỳ) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Giải khê",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Giải khê · Kinh huyệt kinh Vị) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-VI-HU-THUONGHA",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Đại trường",
    "chiDao": "Vị (Thổ) HƯ — khung Thượng–Hạ: BỔ Thổ tại Đại trường (Khúc trì) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Khúc trì",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Hãm cốc · kinh Vị) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Khúc trì · kinh Đại trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Giải khê",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Giải khê · Kinh huyệt kinh Vị) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-VI-HU-PHUTHE",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Đởm",
    "chiDao": "Vị (Thổ) HƯ — khung Phu–Thê: BỔ Thổ tại Đởm (Dương lăng tuyền) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đởm",
        "huyet": "Dương lăng tuyền",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đởm",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Dương lăng tuyền",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Hãm cốc · kinh Vị) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Dương lăng tuyền · kinh Đởm) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Giải khê",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Giải khê · Kinh huyệt kinh Vị) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-VI-HU-TYNGO",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tâm bào",
    "chiDao": "Vị (Thổ) HƯ — khung Tý–Ngọ: BỔ Thổ tại Tâm bào (Đại lăng) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Đại lăng",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Hãm cốc · kinh Vị) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Đại lăng · kinh Tâm bào) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Giải khê",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Giải khê · Kinh huyệt kinh Vị) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-VI-HU-LACKHI",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tâm bào",
    "chiDao": "Vị (Thổ) HƯ — khung Lục Khí: BỔ Thổ tại Tâm bào (Đại lăng) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Vị",
        "huyet": "Giải khê",
        "vaiTro": "Kinh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tâm bào",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Đại lăng",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ suy HƯ bị Mộc Tương Thừa (khắc phạt quá tay) → TẢ Mộc (Hãm cốc · kinh Vị) tại Kinh Gốc ngắt đè nén; BỔ Thổ (Đại lăng · kinh Tâm bào) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "hoa",
      "hanhTen": "Hoả",
      "huyet": "Giải khê",
      "role": "Kinh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thổ suy HƯ → BỔ Hoả (Giải khê · Kinh huyệt kinh Vị) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "ich-hoa-bo-tho",
        "ten": "Ích hoả bổ thổ",
        "han": "益火補土",
        "coChe": "Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-VI-THUC-BIEULY",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Tỳ",
    "chiDao": "Vị (Thổ) THỰC — khung Biểu–Lý: TẢ Thổ tại Tỳ (Thái bạch) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tỳ",
        "huyet": "Thái bạch",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Thái bạch",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Hãm cốc · kinh Vị) để chế ngự Thổ; TẢ Thổ (Thái bạch · kinh Tỳ) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Lệ đoài",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Lệ đoài · Tỉnh huyệt kinh Vị) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-VI-THUC-THUONGHA",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Đại trường",
    "chiDao": "Vị (Thổ) THỰC — khung Thượng–Hạ: TẢ Thổ tại Đại trường (Khúc trì) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Khúc trì",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Hãm cốc · kinh Vị) để chế ngự Thổ; TẢ Thổ (Khúc trì · kinh Đại trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Lệ đoài",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Lệ đoài · Tỉnh huyệt kinh Vị) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-VI-THUC-PHUTHE",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Đởm",
    "chiDao": "Vị (Thổ) THỰC — khung Phu–Thê: TẢ Thổ tại Đởm (Dương lăng tuyền) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Đởm",
        "huyet": "Dương lăng tuyền",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đởm",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Dương lăng tuyền",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Hãm cốc · kinh Vị) để chế ngự Thổ; TẢ Thổ (Dương lăng tuyền · kinh Đởm) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Lệ đoài",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Lệ đoài · Tỉnh huyệt kinh Vị) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-VI-THUC-TYNGO",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Tâm bào",
    "chiDao": "Vị (Thổ) THỰC — khung Tý–Ngọ: TẢ Thổ tại Tâm bào (Đại lăng) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Đại lăng",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Hãm cốc · kinh Vị) để chế ngự Thổ; TẢ Thổ (Đại lăng · kinh Tâm bào) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Lệ đoài",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Lệ đoài · Tỉnh huyệt kinh Vị) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-VI-THUC-LACKHI",
    "kinh": "Vị",
    "hanh": "Thổ",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tâm bào",
    "chiDao": "Vị (Thổ) THỰC — khung Lục Khí: TẢ Thổ tại Tâm bào (Đại lăng) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Tâm bào",
        "huyet": "Đại lăng",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Mộc",
        "kinh": "Vị",
        "huyet": "Hãm cốc",
        "vaiTro": "Du",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "moc",
        "hanhTen": "Mộc",
        "huyet": "Hãm cốc",
        "role": "Du",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tâm bào",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Đại lăng",
        "role": "Du",
        "boTa": "ta"
      },
      "giaiThich": "Thổ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Mộc) → BỔ Mộc (Hãm cốc · kinh Vị) để chế ngự Thổ; TẢ Thổ (Đại lăng · kinh Tâm bào) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Vị",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Lệ đoài",
      "role": "Tỉnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thổ quá THỰC → TẢ Kim (Lệ đoài · Tỉnh huyệt kinh Vị) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Vị",
      "nguyen": {
        "ten": "Xung dương",
        "ma": "ST42"
      },
      "khachKinh": "Tỳ",
      "lac": {
        "ten": "Công tôn",
        "ma": "SP4"
      },
      "giaiThich": "Vị là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Xung dương để vực nguyên khí ngay tại gốc bệnh; Tỳ biểu-lý với Vị nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Công tôn để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-HU-BIEULY",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Phế",
    "chiDao": "Đại trường (Kim) HƯ — khung Biểu–Lý: BỔ Kim tại Phế (Kinh cừ) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Phế",
        "huyet": "Kinh cừ",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Kinh cừ",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Dương khê · kinh Đại trường) tại Kinh Gốc ngắt đè nén; BỔ Kim (Kinh cừ · kinh Phế) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Khúc trì",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Khúc trì · Hợp huyệt kinh Đại trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-HU-THUONGHA",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Vị",
    "chiDao": "Đại trường (Kim) HƯ — khung Thượng–Hạ: BỔ Kim tại Vị (Lệ đoài) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Vị",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Lệ đoài",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Dương khê · kinh Đại trường) tại Kinh Gốc ngắt đè nén; BỔ Kim (Lệ đoài · kinh Vị) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Khúc trì",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Khúc trì · Hợp huyệt kinh Đại trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-HU-PHUTHE",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tiểu trường",
    "chiDao": "Đại trường (Kim) HƯ — khung Phu–Thê: BỔ Kim tại Tiểu trường (Thiếu trạch) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Tiểu trường",
        "huyet": "Thiếu trạch",
        "vaiTro": "Tỉnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thiếu trạch",
        "role": "Tỉnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Dương khê · kinh Đại trường) tại Kinh Gốc ngắt đè nén; BỔ Kim (Thiếu trạch · kinh Tiểu trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Khúc trì",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Khúc trì · Hợp huyệt kinh Đại trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-HU-TYNGO",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Thận",
    "chiDao": "Đại trường (Kim) HƯ — khung Tý–Ngọ: BỔ Kim tại Thận (Phục lưu) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Phục lưu",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Dương khê · kinh Đại trường) tại Kinh Gốc ngắt đè nén; BỔ Kim (Phục lưu · kinh Thận) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Khúc trì",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Khúc trì · Hợp huyệt kinh Đại trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-HU-LACKHI",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tỳ",
    "chiDao": "Đại trường (Kim) HƯ — khung Lục Khí: BỔ Kim tại Tỳ (Thương khâu) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Đại trường",
        "huyet": "Khúc trì",
        "vaiTro": "Hợp",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tỳ",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thương khâu",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim suy HƯ bị Hoả Tương Thừa (khắc phạt quá tay) → TẢ Hoả (Dương khê · kinh Đại trường) tại Kinh Gốc ngắt đè nén; BỔ Kim (Thương khâu · kinh Tỳ) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "tho",
      "hanhTen": "Thổ",
      "huyet": "Khúc trì",
      "role": "Hợp",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Kim suy HƯ → BỔ Thổ (Khúc trì · Hợp huyệt kinh Đại trường) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-sinh-kim",
        "ten": "Bồi thổ sinh kim",
        "han": "培土生金",
        "coChe": "Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-THUC-BIEULY",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Phế",
    "chiDao": "Đại trường (Kim) THỰC — khung Biểu–Lý: TẢ Kim tại Phế (Kinh cừ) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Phế",
        "huyet": "Kinh cừ",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Kinh cừ",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Dương khê · kinh Đại trường) để chế ngự Kim; TẢ Kim (Kinh cừ · kinh Phế) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Nhị gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Nhị gian · Huỳnh huyệt kinh Đại trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-THUC-THUONGHA",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Vị",
    "chiDao": "Đại trường (Kim) THỰC — khung Thượng–Hạ: TẢ Kim tại Vị (Lệ đoài) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Vị",
        "huyet": "Lệ đoài",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Vị",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Lệ đoài",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Dương khê · kinh Đại trường) để chế ngự Kim; TẢ Kim (Lệ đoài · kinh Vị) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Nhị gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Nhị gian · Huỳnh huyệt kinh Đại trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-THUC-PHUTHE",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tiểu trường",
    "chiDao": "Đại trường (Kim) THỰC — khung Phu–Thê: TẢ Kim tại Tiểu trường (Thiếu trạch) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tiểu trường",
        "huyet": "Thiếu trạch",
        "vaiTro": "Tỉnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thiếu trạch",
        "role": "Tỉnh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Dương khê · kinh Đại trường) để chế ngự Kim; TẢ Kim (Thiếu trạch · kinh Tiểu trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Nhị gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Nhị gian · Huỳnh huyệt kinh Đại trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-THUC-TYNGO",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Thận",
    "chiDao": "Đại trường (Kim) THỰC — khung Tý–Ngọ: TẢ Kim tại Thận (Phục lưu) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Thận",
        "huyet": "Phục lưu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Phục lưu",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Dương khê · kinh Đại trường) để chế ngự Kim; TẢ Kim (Phục lưu · kinh Thận) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Nhị gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Nhị gian · Huỳnh huyệt kinh Đại trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-DAITRUONG-THUC-LACKHI",
    "kinh": "Đại trường",
    "hanh": "Kim",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Tỳ",
    "chiDao": "Đại trường (Kim) THỰC — khung Lục Khí: TẢ Kim tại Tỳ (Thương khâu) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Kim",
        "kinh": "Tỳ",
        "huyet": "Thương khâu",
        "vaiTro": "Kinh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Hoả",
        "kinh": "Đại trường",
        "huyet": "Dương khê",
        "vaiTro": "Kinh",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Đại trường",
        "huyet": "Nhị gian",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Đại trường",
        "hanh": "hoa",
        "hanhTen": "Hoả",
        "huyet": "Dương khê",
        "role": "Kinh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tỳ",
        "hanh": "kim",
        "hanhTen": "Kim",
        "huyet": "Thương khâu",
        "role": "Kinh",
        "boTa": "ta"
      },
      "giaiThich": "Kim quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Hoả) → BỔ Hoả (Dương khê · kinh Đại trường) để chế ngự Kim; TẢ Kim (Thương khâu · kinh Tỳ) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Đại trường",
      "hanh": "thuy",
      "hanhTen": "Thuỷ",
      "huyet": "Nhị gian",
      "role": "Huỳnh",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Kim quá THỰC → TẢ Thuỷ (Nhị gian · Huỳnh huyệt kinh Đại trường) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Đại trường",
      "nguyen": {
        "ten": "Hợp cốc",
        "ma": "LI4"
      },
      "khachKinh": "Phế",
      "lac": {
        "ten": "Liệt khuyết",
        "ma": "LU7"
      },
      "giaiThich": "Đại trường là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Hợp cốc để vực nguyên khí ngay tại gốc bệnh; Phế biểu-lý với Đại trường nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Liệt khuyết để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-HU-BIEULY",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Thận",
    "chiDao": "Bàng quang (Thuỷ) HƯ — khung Biểu–Lý: BỔ Thuỷ tại Thận (Âm cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Thận",
        "huyet": "Âm cốc",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Thận",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Âm cốc",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Ủy trung · kinh Bàng quang) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Âm cốc · kinh Thận) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Chí âm",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Chí âm · Tỉnh huyệt kinh Bàng quang) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-HU-THUONGHA",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tiểu trường",
    "chiDao": "Bàng quang (Thuỷ) HƯ — khung Thượng–Hạ: BỔ Thuỷ tại Tiểu trường (Tiền cốc) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Ủy trung · kinh Bàng quang) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Chí âm",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Chí âm · Tỉnh huyệt kinh Bàng quang) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-HU-PHUTHE",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tam tiêu",
    "chiDao": "Bàng quang (Thuỷ) HƯ — khung Phu–Thê: BỔ Thuỷ tại Tam tiêu (Dịch môn) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Ủy trung · kinh Bàng quang) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Chí âm",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Chí âm · Tỉnh huyệt kinh Bàng quang) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-HU-TYNGO",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Phế",
    "chiDao": "Bàng quang (Thuỷ) HƯ — khung Tý–Ngọ: BỔ Thuỷ tại Phế (Xích trạch) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Xích trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Ủy trung · kinh Bàng quang) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Xích trạch · kinh Phế) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Chí âm",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Chí âm · Tỉnh huyệt kinh Bàng quang) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-HU-LACKHI",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "hư",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Phế",
    "chiDao": "Bàng quang (Thuỷ) HƯ — khung Lục Khí: BỔ Thuỷ tại Phế (Xích trạch) — Phù nhược / bồi bản hành.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "bo",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Phù nhược / bồi bản hành"
      },
      {
        "bac": "ta",
        "tacDong": "ta",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường — ngắt đè nén"
      },
      {
        "bac": "kiem",
        "tacDong": "bo",
        "hanh": "Kim",
        "kinh": "Bàng quang",
        "huyet": "Chí âm",
        "vaiTro": "Tỉnh",
        "phap": "Hư tắc bổ kỳ mẫu"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Phế",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Xích trạch",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ suy HƯ bị Thổ Tương Thừa (khắc phạt quá tay) → TẢ Thổ (Ủy trung · kinh Bàng quang) tại Kinh Gốc ngắt đè nén; BỔ Thuỷ (Xích trạch · kinh Phế) tại Kinh Bạn bồi dưỡng chính khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "kim",
      "hanhTen": "Kim",
      "huyet": "Chí âm",
      "role": "Tỉnh",
      "boTa": "bo",
      "giaiThich": "Hư thì bổ Mẫu (Nạn Kinh 69): Thuỷ suy HƯ → BỔ Kim (Chí âm · Tỉnh huyệt kinh Bàng quang) để bồi dưỡng khí sinh cho bản hành."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "kim-thuy-tuong-sinh",
        "ten": "Kim thuỷ tương sinh",
        "han": "金水相生",
        "coChe": "Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "trang-thuy-che-hoa",
        "ten": "Tráng thuỷ chế hoả",
        "han": "壯水制火",
        "coChe": "Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "hu-bo-mau",
        "ten": "Hư tắc bổ kỳ mẫu",
        "han": "虛則補其母",
        "coChe": "Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.",
        "nguon": "Nạn Kinh 69"
      },
      {
        "id": "phu-nhuoc",
        "ten": "Phù nhược",
        "han": "扶弱",
        "coChe": "Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.",
        "nguon": "Nội Kinh · trị tương thừa/tương vũ"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-THUC-BIEULY",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "bieuly",
    "khungTen": "Biểu–Lý",
    "kinhBan": "Thận",
    "chiDao": "Bàng quang (Thuỷ) THỰC — khung Biểu–Lý: TẢ Thuỷ tại Thận (Âm cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Thận",
        "huyet": "Âm cốc",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Bàng quang",
        "huyet": "Thúc cốt",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Thận",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Âm cốc",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Ủy trung · kinh Bàng quang) để chế ngự Thuỷ; TẢ Thuỷ (Âm cốc · kinh Thận) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thúc cốt",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Thúc cốt · Du huyệt kinh Bàng quang) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-THUC-THUONGHA",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "thuongha",
    "khungTen": "Thượng–Hạ",
    "kinhBan": "Tiểu trường",
    "chiDao": "Bàng quang (Thuỷ) THỰC — khung Thượng–Hạ: TẢ Thuỷ tại Tiểu trường (Tiền cốc) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tiểu trường",
        "huyet": "Tiền cốc",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Bàng quang",
        "huyet": "Thúc cốt",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tiểu trường",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Tiền cốc",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Ủy trung · kinh Bàng quang) để chế ngự Thuỷ; TẢ Thuỷ (Tiền cốc · kinh Tiểu trường) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thúc cốt",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Thúc cốt · Du huyệt kinh Bàng quang) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-THUC-PHUTHE",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "phuthe",
    "khungTen": "Phu–Thê",
    "kinhBan": "Tam tiêu",
    "chiDao": "Bàng quang (Thuỷ) THỰC — khung Phu–Thê: TẢ Thuỷ tại Tam tiêu (Dịch môn) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Tam tiêu",
        "huyet": "Dịch môn",
        "vaiTro": "Huỳnh",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Bàng quang",
        "huyet": "Thúc cốt",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Tam tiêu",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Dịch môn",
        "role": "Huỳnh",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Ủy trung · kinh Bàng quang) để chế ngự Thuỷ; TẢ Thuỷ (Dịch môn · kinh Tam tiêu) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thúc cốt",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Thúc cốt · Du huyệt kinh Bàng quang) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-THUC-TYNGO",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "tyngo",
    "khungTen": "Tý–Ngọ",
    "kinhBan": "Phế",
    "chiDao": "Bàng quang (Thuỷ) THỰC — khung Tý–Ngọ: TẢ Thuỷ tại Phế (Xích trạch) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Bàng quang",
        "huyet": "Thúc cốt",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Xích trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Ủy trung · kinh Bàng quang) để chế ngự Thuỷ; TẢ Thuỷ (Xích trạch · kinh Phế) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thúc cốt",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Thúc cốt · Du huyệt kinh Bàng quang) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  },
  {
    "ma": "NHHT-BANGQUANG-THUC-LACKHI",
    "kinh": "Bàng quang",
    "hanh": "Thuỷ",
    "trangThai": "thực",
    "khung": "lackhi",
    "khungTen": "Lục Khí",
    "kinhBan": "Phế",
    "chiDao": "Bàng quang (Thuỷ) THỰC — khung Lục Khí: TẢ Thuỷ tại Phế (Xích trạch) — Thực tắc tả kỳ tử / tiết thực.",
    "menhLenh": [
      {
        "bac": "chinh",
        "tacDong": "ta",
        "hanh": "Thuỷ",
        "kinh": "Phế",
        "huyet": "Xích trạch",
        "vaiTro": "Hợp",
        "phap": "Thực tắc tả kỳ tử / tiết thực"
      },
      {
        "bac": "ta",
        "tacDong": "bo",
        "hanh": "Thổ",
        "kinh": "Bàng quang",
        "huyet": "Ủy trung",
        "vaiTro": "Hợp",
        "phap": "Ức cường bằng kẻ khắc"
      },
      {
        "bac": "kiem",
        "tacDong": "ta",
        "hanh": "Mộc",
        "kinh": "Bàng quang",
        "huyet": "Thúc cốt",
        "vaiTro": "Du",
        "phap": "Thực tắc tả kỳ tử"
      }
    ],
    "huyetNguDu": {
      "bo": {
        "kinh": "Bàng quang",
        "hanh": "tho",
        "hanhTen": "Thổ",
        "huyet": "Ủy trung",
        "role": "Hợp",
        "boTa": "bo"
      },
      "ta": {
        "kinh": "Phế",
        "hanh": "thuy",
        "hanhTen": "Thuỷ",
        "huyet": "Xích trạch",
        "role": "Hợp",
        "boTa": "ta"
      },
      "giaiThich": "Thuỷ quá THỰC gây Tương Thừa (đè nén hành bị khắc) & Tương Vũ (phản khắc Thổ) → BỔ Thổ (Ủy trung · kinh Bàng quang) để chế ngự Thuỷ; TẢ Thuỷ (Xích trạch · kinh Phế) tại Kinh Bạn để xả bớt thực khí."
    },
    "huyetNanKinh": {
      "kinh": "Bàng quang",
      "hanh": "moc",
      "hanhTen": "Mộc",
      "huyet": "Thúc cốt",
      "role": "Du",
      "boTa": "ta",
      "giaiThich": "Thực thì tả Tử (Nạn Kinh 69): Thuỷ quá THỰC → TẢ Mộc (Thúc cốt · Du huyệt kinh Bàng quang) để rút bớt thực khí dư thừa."
    },
    "huyetNguyenLac": {
      "chuKinh": "Bàng quang",
      "nguyen": {
        "ten": "Kinh cốt",
        "ma": "BL64"
      },
      "khachKinh": "Thận",
      "lac": {
        "ten": "Đại chung",
        "ma": "KI4"
      },
      "giaiThich": "Bàng quang là kinh bệnh TRƯỚC (chủ, phủ (biểu)) → lấy huyệt Nguyên Kinh cốt để vực nguyên khí ngay tại gốc bệnh; Thận biểu-lý với Bàng quang nên bệnh theo lạc mạch truyền sang (khách) → lấy huyệt Lạc Đại chung để cắt đường thông giữa hai kinh."
    },
    "phapCoDien": [
      {
        "id": "boi-tho-che-thuy",
        "ten": "Bồi thổ chế thuỷ",
        "han": "培土制水",
        "coChe": "Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.",
        "nguon": "pháp trị cổ điển"
      },
      {
        "id": "thuc-ta-tu",
        "ten": "Thực tắc tả kỳ tử",
        "han": "實則瀉其子",
        "coChe": "Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.",
        "nguon": "Nạn Kinh 69"
      }
    ]
  }
];
