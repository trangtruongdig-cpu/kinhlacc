# Javis Index (tầng vận hành)

Generated 2026-09-08. Tự học loop `kinhlacc-learn` sẽ cập nhật định kỳ.

**Tổng quan:** 3 agents · 8 skills (3 YHCT mới) · 1 workflows · 1 loops (chờ kích hoạt) · 10+ plugins

---

## Agents

### Y học cổ truyền

- **diagnose-syndrome** — Chẩn đoán chứng bệnh YHCT từ triệu chứng. Dùng [[Taxonomy Kinh Lắc]].  
  [agents/diagnose-syndrome.md] — **Status**: ready (enabled: false)

- **formula-composer** — Soạn bài thuốc theo chứng bệnh, kết hợp liệu 4 tầng.  
  [agents/formula-composer.md] — **Status**: ready (enabled: false)

- **meridian-analyst** — Phân tích kinh mạch → huyệt vị châm cứu, hướng dẫn kỹ thuật.  
  [agents/meridian-analyst.md] — **Status**: ready (enabled: false)

---

## Skills

### Hệ thống mặc định (AI)

- **Ingest Source** (`ingest-source`) - Tiêu hoá source thô vào wiki
- **Javis Builder** (`javis-builder`) - Tạo/sửa agent/skill/workflow/loop
- **Lint Wiki** (`lint-wiki`) - Quét sức khoẻ wiki
- **Notes** (`notes`) - Lưu note vào sources
- **Query Wiki** (`query-wiki`) - Truy vấn wiki

### Y học cổ truyền (mới)

- **patient-intake** (`patient-intake`) — Tiếp nhận bệnh nhân: ghi triệu chứng, tiền sử, dị ứng.  
  [skills/patient-intake/] — **Status**: active

- **formula-craft** (`formula-craft`) — Soạn bài thuốc: 4 tầng quân-tướng-tá-sứ, kiểm tương tác.  
  [skills/formula-craft/] — **Status**: active

- **acupoint-guide** (`acupoint-guide`) — Hướng dẫn châm cứu: định vị huyệt + kỹ thuật an toàn.  
  [skills/acupoint-guide/] — **Status**: active

---

## Workflows

- **ingest-kinhlacc-wisdom** — Orchestrate: INGEST wiki + tạo agents + tạo skills + tạo loop.  
  [workflows/ingest-kinhlacc-wisdom.md] — **Status**: ready (enabled: false)

---

## Loops (Tự động định kỳ)

- **kinhlacc-learn** — Hàng tuần: quét Wiki health + backend schema + agents/skills audit.  
  [Javis/loops/kinhlacc-learn.md] — **Status**: ready (enabled: false)  
  **Cron**: Thứ 2-5 lúc 8h sáng VN time · **Output**: `wiki/_health-check.md`, `backend/_schema-audit.md`, `Javis/_audit.md`

---

## Wiki (Tri thức tích luỹ)

Xem [[Wiki/index.md]] để theo dõi các trang wiki hiện có.

**Hiện tại**:
- [[Taxonomy Kinh Lắc]] — Framework phân loại YHCT (12 kinh, huyệt vị, chứng, pháp trị, bài)
- [[Domain Kinh Lắc]] — Tổng quan dự án (Y học cổ truyền + web app + giáo dục)
- [[Second Brain Kinhlacc]] — Quy ước vault Obsidian/Javis
- 3 wiki khác (Nguồn dữ liệu, session-handoff, open-questions)

---

## Plugins (Mặc định)

_(Xem khuôn cũ để danh sách plugins toàn bộ: 10+ plugin hệ thống + 1 plugin tùy chỉnh)_

- **datetime-vn** — Xem ngày giờ VN + tính ngày tương đối
- **fb-monitor** — Theo dõi Facebook public posts
- **image-chatgpt** — Tạo ảnh (ChatGPT)
- **javis-connect**, **javis-schedule**, **javis-task** — Kết nối MCP + đặt việc định kỳ + giao Kanban
- **meta-ads**, **fb-pages** — Quản lý Meta Ads + Facebook Trang
- **zalo-image** — Gửi ảnh qua Zalo

---

## Cách kích hoạt

```bash
# Bật agent
POST /agents/diagnose-syndrome/enable

# Bật loop
POST /loops/kinhlacc-learn/enable

# Chạy workflow
POST /workflows/ingest-kinhlacc-wisdom/run
```

---

**Sinh ra bởi**: Javis auto-ingest workflow (2026-09-08)  
**Cập nhật cuối**: kinhlacc-learn loop (định kỳ)
