---
name: kinhlacc-learn
description: "Loop tự học định kỳ cho dự án kinh lắc - cập nhật Wiki + quét schema. Chạy hàng tuần."
enabled: false
mode: suggest
owner_chat: ""
notify: false
---

# Kinhlacc Self-Learn Loop

Hàng tuần, Javis tự kiểm:
1. **Wiki health-check** - có mâu thuẫn, orphan, broken link?
2. **Backend schema update** - có migration mới? entity nào mới?
3. **Agents + Skills** - có bị deprecate, missing docs?
4. **Report** - issue list để user xem + fix từng cái

## Chi tiết công việc

### 1. Quét Wiki (Thứ Hai)

```
for each file in wiki/:
  - Check frontmatter: type, status, source, created/updated
  - Check for broken [[links]]
  - Check for orphan (không inbound link)
  - Check for claim cũ (> 3 tháng không cập nhật)
  
Output: `wiki/_health-check.md`
- Broken links: danh sách
- Orphan pages: danh sách
- Stale claims: danh sách
- Mâu thuẫn: danh sách (cần human review)
```

### 2. Quét Backend Schema (Thứ Tư)

```
cd backend/
- git log --oneline src/models/ > models.diff (tìm entity mới)
- grep -r "@Entity" src/models/ (liệt kê models)
- Kiểm: có entity mới → trang Wiki mới chưa?
- Kiểm: API route mới → docs mới chưa?

Output: `backend/_schema-audit.md`
- Entities mới: danh sách + vị trí
- Routes mới: danh sách
- Fields mới: danh sách  
- MISSING WIKI: danh sách (khoảng trống)
```

### 3. Quét Agents + Skills (Thứ Năm)

```
Check:
- agents/*.md: có tài liệu đầy đủ?
- skills/*/SKILL.md: có trigger/description rõ?
- Javis/index.md: up-to-date chưa?

Output: `Javis/_audit.md`
- Agents chết: danh sách (không có docs)
- Skills chết: danh sách
- Gaps: cần tạo skill/agent gì
```

### 4. Tóm tắt + Report (Thứ Sáu)

```
Gửi report:
- **Green**: ✅ Wiki sạch, schema đồng bộ
- **Amber**: ⚠️ Có X broken links, Y orphan pages, Z schema mismatches
- **Red**: ❌ có entity mới chưa doc, có skill dead, cần fix ngay

Action items (nếu >5 issues):
1. fix top 3 broken links
2. Archive 2 orphan pages
3. Tạo 1 wiki page cho entity mới
```

## Lịch chạy

- **Mỗi thứ 2 lúc 8h sáng** (VN time)
- **Kéo dài ~10 phút**
- **Output**: `wiki/_health-check.md`, `backend/_schema-audit.md`, `Javis/_audit.md`
- **Báo về**: kênh chat (hoặc Telegram nếu > 10 issues)

## Nếu incomplete

Ghi lại state vào `Javis/_session-handoff.md`:
```
## kinhlacc-learn run

**Status**: incomplete
**Ran**: 2026-09-08 14:30
**Completed**: 1a (Wiki quét xong)
**Pending**: 2 (Backend schema), 3 (Agents), 4 (Report)
**Blocker**: (nếu có)
**Next**: tiếp tục từ bước 2
```

## Mục tiêu

- Wiki luôn sạch (0 broken links, <5% orphan)
- Schema luôn đồng bộ (entity mới → wiki mới trong 1 tuần)
- Agents + Skills luôn active (doc đầy đủ, trigger rõ)

---

**Người tạo**: Javis auto-ingest workflow
**Ngày tạo**: 2026-09-08
**Status**: ready to enable
