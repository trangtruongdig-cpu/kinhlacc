---
type: decision
provenance: assistant
origin: javis-learned
created: 2026-09-09
updated: 2026-09-09
---
`POST /benh-dong-y-excel/diagnose` trước chỉ trả boolean matched/không. Giờ mỗi bệnh khớp có thêm:
```json
{"matched": true, "confidence": {"score": 83, "level": "high", "matchedClauses": 5, "totalClauses": 6}}
```
Cách tính: đếm số mệnh đề so sánh (CMP) trong AST của `logicExpression` đã khớp chia cho tổng số mệnh đề CMP. Bệnh có score cao được xếp lên đầu danh sách trả về.
