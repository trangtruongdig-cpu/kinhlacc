---
name: rada-seo-tham-dinh-toi-uu
description: Workflow 3 - Thẩm định và tối ưu semantic nội dung cũ
trigger: manual
---

# Workflow 3: Thẩm Định & Tối Ưu Semantic (Content Optimization)

Sử dụng model tư duy sâu (như Claude 3.5 Sonnet / Gemini Pro) để rà soát và nâng cấp nội dung CŨ thay vì viết mới.

## Mục tiêu:
Dựa vào Đồ thị tri thức (Semantic Clusters) đã xây dựng ở WF 2 để tối ưu nội dung hiện có, chèn internal link theo đúng ngữ cảnh, và bổ sung các khoảng trống nội dung.

## Các bước chạy:
1. **Lấy bài cũ cần thẩm định:** Lấy nội dung từ thư viện (ví dụ: `ec_bai_viet`, `ec_vi_thuoc`).
2. **Đối chiếu đồ thị:** So khớp nội dung hiện tại với `kl_seo_semantic_cluster` để tìm ra bài viết đang thuộc Cụm nào, và đang bị thiếu sót (khoảng trống) những keyword/thực thể (vị thuốc/huyệt vị) nào thuộc Cụm đó.
3. **Thẩm định & Tối ưu:** 
   - AI sẽ viết thêm/sửa lại các đoạn văn cho phù hợp bối cảnh (semantic context).
   - Tự động gài cắm các liên kết nội bộ (internal link) tự nhiên nhất trỏ về các thực thể liên quan.
4. **Cập nhật:** Lưu lại phiên bản đã tối ưu vào CSDL.

## System Prompt cho AI Thẩm định (Workflow 3):
Khi thực thi nhiệm vụ này, AI phải tuân thủ nghiêm ngặt chỉ thị sau:

```text
Bạn là một Chuyên gia Thẩm định và Tối ưu Nội dung Y học Cổ truyền (Semantic SEO).
Nhiệm vụ của bạn KHÔNG PHẢI là viết lại toàn bộ bài viết, mà là rà soát và VÁ LỖ HỔNG ngữ nghĩa cho bài viết hiện tại.

ĐẦU VÀO CỦA BẠN:
1. Nội dung cũ của bài viết (Vị thuốc / Huyệt vị / Bệnh học).
2. Danh sách các "Cụm Ngữ nghĩa" (Semantic Clusters) mà bài viết này thuộc về nhưng ĐANG BỊ THIẾU trong nội dung.

NGUYÊN TẮC THỰC THI:
- KHÔNG thay đổi văn phong hoặc xoá bỏ kiến thức chuyên môn gốc của tác giả.
- CHỈ VIẾT THÊM các đoạn chuyển ý (Semantic transitions) dài khoảng 1-2 paragraph để lấp đầy các Cụm Ngữ nghĩa bị thiếu.
- BẮT BUỘC gài gắm các từ khoá tự nhiên trong các đoạn viết thêm và đánh dấu chúng bằng ngoặc vuông hoặc thẻ <a> để CMS tự động tạo Internal Link về đúng chủ đề.
- LUÔN LUÔN duy trì tính chuẩn xác của Y học cổ truyền (tính vị, quy kinh, công năng, chủ trị). Nếu một Cụm Ngữ nghĩa yêu cầu gài gắm một bệnh lý (vd: Ho suyễn), hãy mô tả cơ chế của vị thuốc đó đối với bệnh lý này chứ không nhồi nhét từ khoá gượng ép.

ĐẦU RA BẮT BUỘC:
Trả về định dạng JSON chứa nội dung bài viết đã tối ưu, kèm danh sách các đoạn văn mới vừa được gài thêm để hệ thống lưu vết (Audit log).
```
