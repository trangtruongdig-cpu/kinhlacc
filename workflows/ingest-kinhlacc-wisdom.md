---
name: ingest-kinhlacc-wisdom
description: "Orchestrate: INGEST tri thức kinh lắc từ Wiki + backend → Wiki tích luỹ; TẠO Agents + Skills chuyên; TẠO Loop tự học. Full bootstrap cho knowledge domain kinh lạc."
enabled: false
mode: suggest
notify: false
owner_chat: ""
---

# INGEST Kinh Lắc Wisdom

Workflow điều phối:
1. **INGEST** dữ liệu hiện có → Wiki tích luỹ  
2. **CREATE AGENTS** chuyên kinh lạc  
3. **CREATE SKILLS** cho Y học cổ truyền  
4. **CREATE LOOP** tự học định kỳ

## Bước 1: INGEST tri thức hiện có

### 1a. Ingest Wiki hiện có + backend README
- Xem Wiki/ folder (6 file)
- Xem backend/README.md
- Xem DEPLOYMENT.md để hiểu kiến trúc
- → Tiêu hoá thành Wiki chuyên sâu (5-10 trang)
- **Output**: /Wiki/Domain Kinh Lắc.md (cập nhật)

### 1b. Xây dựng taxonomy kinh lạc
- Sưu tầm từ Wiki: khái niệm + entity
- → Tạo trang `[[Taxonomy Kinh Lắc]]`
- Phân loại: Kinh (meridian) | Lạc (collateral) | Huyệt vị (acupoint) | Chứng bệnh (syndrome) | Phương pháp trị (method) | Bài thuốc (formula)

### 1c. Rút ra dữ liệu từ backend
- Xem schema: `src/models/` (disease, meridian, acupoint, formula)
- Xem router examples: `src/routers/`
- → Tạo trang `[[API Schema Kinh Lắc]]` (docstring + entity map)

**Người phụ trách**: Agent `ingest-kinhlacc`
**Đầu ra**:
- `wiki/Domain Kinh Lắc.md` (cập nhật)
- `wiki/Taxonomy Kinh Lắc.md` (mới)
- `wiki/API Schema Kinh Lắc.md` (mới)
- `wiki/log.md` (append)

---

## Bước 2: Tạo Agents chuyên kinh lạc

### 2a. Agent `diagnose-kinhlacc`
- Vai: chẩn đoán hội chứng từ triệu chứng bệnh nhân
- Dùng: taxonomy + domain knowledge
- Skill: query-wiki (truy vấn Wiki), health-intake (tiếp nhận bệnh nhân)
- **Output**: `agents/diagnose-kinhlacc.md`

### 2b. Agent `formula-composer`  
- Vai: đề xuất bài thuốc theo chứng bệnh
- Dùng: phương pháp trị + bài thuốc sẵn có
- Skill: compose-formula, query-wiki
- **Output**: `agents/formula-composer.md`

### 2c. Agent `meridian-analyzer`
- Vai: phân tích kinh mạch, huyệt vị
- Dùng: map huyệt theo kinh, phương pháp châm cứu
- Skill: meridian-map, query-wiki
- **Output**: `agents/meridian-analyzer.md`

**Người phụ trách**: Agent `create-agents-kinhlacc`

---

## Bước 3: Tạo Skills chuyên Y học cổ truyền

### 3a. Skill `health-intake`
- Hỗ trợ: tiếp nhận, ghi nhận triệu chứng/tiền sử bệnh nhân
- Trigger: bệnh nhân mới, cập nhật hồ sơ
- **Output**: `skills/health-intake/SKILL.md`

### 3b. Skill `compose-formula`  
- Hỗ trợ: soạn bài thuốc từ liệu + method
- Trigger: khi agent cần đề xuất bài
- **Output**: `skills/compose-formula/SKILL.md`

### 3c. Skill `meridian-map`
- Hỗ trợ: tra cứu huyệt vị theo kinh, phương pháp châm
- Trigger: phân tích kinh mạch
- **Output**: `skills/meridian-map/SKILL.md`

**Người phụ trách**: Agent `create-skills-kinhlacc`

---

## Bước 4: Tạo Loop tự học

### 4a. Loop `kinhlacc-learn`  
- Chạy: hàng tuần (hoặc định kỳ tùy settings)
- Việc: 
  - Quét `backend/sql/` có migration mới → INGEST
  - Quét `Wiki/log.md` có gap → cảnh báo incomplete
  - Quét agents/skills → health-check (dead link, orphan)
- **Output**: 
  - `Javis/loops/kinhlacc-learn.md` (mới)
  - Report: issue list (nếu có)

**Người phụ trách**: Agent `create-loop-kinhlacc`

---

## Trạng thái + Checkpoint

| Bước | Trạng thái | Output | Checkpoint |
|---|---|---|---|
| 1a | ⏳ INGEST | Wiki/* | Có 3 trang Wiki chuyên |
| 1b | ⏳ INGEST | taxonomy.md | Taxonomy đầy đủ |
| 1c | ⏳ INGEST | schema.md | Schema rõ ràng |
| 2a | ⏳ CREATE | diagnose-kinhlacc.md | Agent chạy được |
| 2b | ⏳ CREATE | formula-composer.md | Agent chạy được |
| 2c | ⏳ CREATE | meridian-analyzer.md | Agent chạy được |
| 3a | ⏳ CREATE | health-intake/SKILL.md | Skill active |
| 3b | ⏳ CREATE | compose-formula/SKILL.md | Skill active |
| 3c | ⏳ CREATE | meridian-map/SKILL.md | Skill active |
| 4a | ⏳ CREATE | kinhlacc-learn.md | Loop active (disabled) |

---

## Workflow notes

- Mode: `suggest` (không tự làm hành động) → user xem + duyệt từng trang
- Disable agents tạm, chỉ enable khi user yêu cầu
- Lưu trạng thái ở `Javis/loops/ingest-kinhlacc.log` để nối lại được
- Nếu incomplete: ghi `_session-handoff.md` để model sau tiếp tục

---

## Run workflow

```bash
# Bước 1: INGEST
POST /task  # 1a: ingest-wiki
POST /task  # 1b: create-taxonomy  
POST /task  # 1c: extract-schema

# Bước 2: AGENTS
POST /task  # 2a: create-diagnose-agent
POST /task  # 2b: create-formula-agent
POST /task  # 2c: create-meridian-agent

# Bước 3: SKILLS
POST /task  # 3a: create-health-intake-skill
POST /task  # 3b: create-formula-skill
POST /task  # 3c: create-meridian-skill

# Bước 4: LOOP
POST /task  # 4a: create-learn-loop

# Cleanup
POST /javis_schedule op=create → daily heartbeat
```
