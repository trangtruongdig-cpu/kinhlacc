---
type: wiki
status: active
tags: [workflow, consolidation, knowledge-management, ingest]
origin: javis-learned-2026-09-08
created: 2026-09-08
updated: 2026-09-08
---

# Knowledge Consolidation - Multi-Source INGEST Pattern

**Workflow** được rút ra từ dự án Kinh Lạc (kinhlacc), tái dùng được cho bất kỳ app miền nào cần consolidate kiến thức từ nhiều nguồn.

## Tổng quát

Quy trình **INGEST → CLASSIFY → WIKI** để tiêu hoá dữ liệu từ 3 nguồn (Code schema, Rule files, External docs) thành tri thức structured, tái dùng được qua Agents/Skills.

## Workflow 3 bước

### 1. **INGEST Code Schema** (Fast, local)

**Mục tiêu**: Tóm tắt cấu trúc dữ liệu từ TypeORM/ORM models.

**Quy trình**:
```
Read app.module.ts 
  → Extract all @Entity() classes
  → Classify by domain (Patient, Diagnosis, Treatment, etc.)
  → Count relationships
  → Generate Wiki "Backend Data Model"
```

**Output**: 1 Wiki file ghi:
- Danh sách entities theo nhóm
- Trường chính mỗi entity
- Relationship map
- Luồng dữ liệu (patient → examination → syndrome → formula)

**Ví dụ (Kinh Lạc)**: 84 entities → 11 nhóm

**Chi phí**: 1 đọc file, 1 write wiki (token-efficient)

---

### 2. **INGEST Rule Files** (Medium, parseable)

**Mục tiêu**: Parse logic rules từ JSON/YAML/Excel → tóm tắt thành Wiki.

**Quy trình**:
```
Read rule file (disease-rules.json, policies.yaml, etc.)
  → Parse structure (loop through records)
  → Extract key logic per rule
  → Classify by category/domain
  → Generate Wiki "Rules Reference"
```

**Output**: 1 Wiki file ghi:
- Danh sách rules theo nhóm
- Logic expression cho mỗi rule
- Điều kiện kích hoạt
- Kết quả / output

**Ví dụ (Kinh Lạc)**: 47 diagnostic rules → table gồp logic + tên chứng

**Chi phí**: Parse JSON + generate table (token-efficient)

---

### 3. **INGEST External Docs** (Slow, requires auth)

**Mục tiêu**: Lấy tài liệu từ Google Drive / Cloud → tóm tắt Wiki.

**Precondition MUST CHECK**:
- ✅ Google Drive / external MCP ready?
- ✅ OAuth authenticated?
- ✅ File permissions OK?

**Nếu thiếu precondition**:
- **KHÔNG enqueue task suông** - nó sẽ fail/hang
- Đề xuất: "Bạn cần kết nối Google Drive trước. Hoặc upload file tại đây?"
- 3 hướng: (A) user upload ngay, (B) user auth Google Drive, (C) skip

**Quy trình (nếu sẵn sàng)**:
```
MCP list Google Drive files
  → Filter by type (PDF, Excel, Markdown)
  → Download & read (batch)
  → Summarize key sections
  → Generate Wiki "External Knowledge"
```

**Output**: N Wiki files:
- Per-document summary
- Key concepts extracted
- Link to source

**Ví dụ (Kinh Lạc)**: 5 YHCT docs → 5 wiki (theory, protocols, formulas, etc.)

**Chi phí**: Highest - OAuth, network, parsing multiple files

---

## Precondition Checklist

**Trước khi enqueue task INGEST, PHẢI check**:

| Source | Precondition | Check how | Fallback |
|--------|--------------|-----------|----------|
| **Code Schema** | Code repo local? | File exists | Use cached schema |
| **Rule Files** | Rule file local? | `jq length file.json` | Use cached rules |
| **Google Drive** | MCP connected + OAuth? | `javis_connections` | Ask user to auth OR upload |
| **Email / Calendar** | Gmail/Calendar MCP? | MCP list | Skip, ask user to connect |

**Rule**: KHÔNG tạo task nếu precondition thiếu → báo user → chọn hướng cụ thể.

---

## Chiến lược INGEST linh hoạt

Tuỳ tình huống, chọn chiến lược:

| Chiến lược | Khi nào | Cách làm | Chi phí |
|-----------|---------|----------|---------|
| **A) Quick** | User upload file sẵn | Dùng skill `ingest-source` ngay | Low, 1 lượt |
| **B) Full** | MCP ready, setup 1 lần | Enqueue task chạy nền | Medium, async |
| **C) Minimal** | Nguồn phức tạp | Chỉ dùng sẵn, skip external | Zero |

**Khuyến nghị**: 
- Ưu tiên **A** (nhanh, đơn giản)
- Fallback **B** (đầy đủ nếu user kết nối MCP)
- **C** là safe default (không block)

---

## Pattern: Gộp việc theo lô (Token-efficient)

**Mục tiêu**: Maximize output per read.

**Sai (lãng phí token)**:
```
Read file A → 1 Wiki
Read file B → 1 Wiki  
Read file C → 1 Wiki
= 3 reads, 3 writes
```

**Đúng (gộp)**:
```
Read A, B, C → 1 write tổng hợp
= 1 read cycle, 1 write
```

**Cách áp dụng**:
- Read 1 lần → extract multiple pieces (entities, relationships, stats)
- Write 1 wiki → ghi tất cả thông tin cấu trúc
- Không đọc lại file đã đọc

**Ví dụ (Kinh Lạc)**: 
- Read `app.module.ts` 1 lần → extract 84 entities + 11 nhóm + relationships → 1 wiki

---

## Template: Multi-Source Wiki

Khi tạo consolidation wiki, dùng structure này:

```markdown
---
type: wiki
origin: [[conversation/YYYY-MM-DD]]
sources: [Backend schema, disease-rules.json, Google Drive docs]
created: YYYY-MM-DD
---

# [Domain] Knowledge Consolidation

## 1. From Code Schema
[Backend data model summary]

## 2. From Rule Files  
[Diagnostic/business rules]

## 3. From External Docs
[Concept, theory, procedures]

## Integration Map
[How these 3 sources interlock]

## Luồng dữ liệu chính
[Data flow diagram / text]
```

---

## Bài học rút ra

### ✅ Làm đúng
1. **Check precondition trước enqueue** - không hứa task nếu MCP chưa ready
2. **Gộp việc theo lô** - reduce read cycles
3. **Phân loại data trước ingest** - cấu trúc hóa dữ liệu
4. **3 chiến lược flexible** - Quick/Full/Minimal để adapt

### ❌ Làm sai
1. **Hứa suông** - "sẽ enqueue task chạy nền" mà KHÔNG check precondition
2. **Đọc nhiều lần** - mỗi file mỗi lần thay vì extract max
3. **Không classify** - dump raw data vào wiki (84 entities liệt kê thẳng)
4. **Rigid strategy** - chỉ support 1 cách (không có fallback)

---

## Tái dùng cho app khác

**Áp dụng pattern này cho bất kỳ domain nào**:

1. **Healthcare app**: Code schema (Patient/Visit) → Clinical rules → External guidelines
2. **E-commerce**: Schema (Product/Order) → Business rules → Supplier docs
3. **Finance**: Schema (Account/Transaction) → Compliance rules → Regulatory docs
4. **HR**: Schema (Employee/Payroll) → HR policies → Labor law docs

**Điều kiện tái dùng**:
- ✅ App có ORM schema (TypeORM, Sequelize, etc.)
- ✅ Business logic trong files (JSON, YAML, Excel)
- ✅ External knowledge có sẵn (docs, API, wiki)

---

## Liên kết

- [[Backend Data Model]] - data schema chi tiết (Kinh Lạc)
- [[Disease Rules - Logic Engine]] - rule reference (Kinh Lạc)
- [[Domain Kinh Lạc]] - domain knowledge
