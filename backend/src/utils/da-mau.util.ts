/**
 * Dò NHIỀU MẪU cùng lúc trong nhiều văn bản (Aho–Corasick).
 *
 * VÌ SAO TỒN TẠI: `cumNguNghia` hỏi "mỗi cụm có bao nhiêu bài thuốc nhắc tới nó", và cách thẳng
 * tay là `kho.filter((x) => khoa.some((k) => x.includes(k)))` — 277 cụm × ~8 khoá × 13.911 bài
 * ≈ **30 triệu phép so chuỗi**. Đo 03/10/2026: lời gọi nguội mất **10,2 giây**, và đó chính là
 * câu "lượt đầu mất khoảng 10–15 giây" trên màn Khoảng trống. Không phải chờ CSDL — là CPU.
 *
 * Aho–Corasick đi MỘT lượt qua từng văn bản và bắt mọi mẫu cùng lúc, nên tổng công bằng tổng độ
 * dài văn bản (~1,7 triệu ký tự) chứ không nhân với số mẫu.
 *
 * ⚠️ NGỮ NGHĨA PHẢI GIỐNG HỆT `String.includes`: khớp CHUỖI CON, không ranh giới từ, không chuẩn
 * hoá gì thêm. Phía gọi đã `boDau()` cả hai bên; đổi ngữ nghĩa ở đây là lặng lẽ đổi mọi con số
 * tháp. Có phép kiểm đối chiếu với bản quét thẳng tay.
 */

interface Nut {
  ke: Map<string, number>;
  hong: number;
  /** Chỉ số mẫu KẾT THÚC tại nút này (gồm cả mẫu là hậu tố, gộp sẵn khi dựng). */
  ra: number[];
}

export class DoNhieuMau {
  private readonly nut: Nut[] = [{ ke: new Map(), hong: 0, ra: [] }];

  /** @param mau danh sách mẫu; mẫu rỗng bị bỏ (nó khớp mọi văn bản, không nói lên điều gì). */
  constructor(private readonly mau: string[]) {
    mau.forEach((m, i) => {
      if (!m) return;
      let u = 0;
      for (const c of m) {
        let k = this.nut[u].ke.get(c);
        if (k === undefined) {
          k = this.nut.length;
          this.nut.push({ ke: new Map(), hong: 0, ra: [] });
          this.nut[u].ke.set(c, k);
        }
        u = k;
      }
      this.nut[u].ra.push(i);
    });
    // Dựng liên kết hỏng theo BFS, và gộp `ra` của nút hỏng vào — nhờ vậy lúc chạy không phải
    // lần ngược chuỗi hỏng cho mỗi ký tự.
    const hang: number[] = [];
    for (const [, k] of this.nut[0].ke) {
      this.nut[k].hong = 0;
      hang.push(k);
    }
    for (let i = 0; i < hang.length; i++) {
      const u = hang[i];
      this.nut[u].ra = [...new Set([...this.nut[u].ra, ...this.nut[this.nut[u].hong].ra])];
      for (const [c, k] of this.nut[u].ke) {
        let h = this.nut[u].hong;
        while (h !== 0 && !this.nut[h].ke.has(c)) h = this.nut[h].hong;
        this.nut[k].hong = this.nut[h].ke.get(c) ?? 0;
        if (this.nut[k].hong === k) this.nut[k].hong = 0;
        hang.push(k);
      }
    }
  }

  /** Chỉ số các mẫu CÓ MẶT trong `chu`. Dừng sớm khi đã gặp đủ mọi mẫu. */
  timTrong(chu: string): Set<number> {
    const thay = new Set<number>();
    let u = 0;
    for (const c of chu) {
      while (u !== 0 && !this.nut[u].ke.has(c)) u = this.nut[u].hong;
      u = this.nut[u].ke.get(c) ?? 0;
      for (const i of this.nut[u].ra) thay.add(i);
      if (thay.size === this.mau.length) break;
    }
    return thay;
  }

  /**
   * Với mỗi mẫu, tập CHỈ SỐ VĂN BẢN có chứa nó.
   * @returns mảng cùng thứ tự `mau`; phần tử là Set chỉ số trong `dsChu`.
   */
  theoMau(dsChu: string[]): Set<number>[] {
    const ra: Set<number>[] = this.mau.map(() => new Set<number>());
    dsChu.forEach((chu, j) => {
      for (const i of this.timTrong(chu)) ra[i].add(j);
    });
    return ra;
  }
}
