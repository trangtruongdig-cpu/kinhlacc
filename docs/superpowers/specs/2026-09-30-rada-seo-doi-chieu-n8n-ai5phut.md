# Rada SEO — đối chiếu với hệ n8n của "5 Phút AI" (ai5phut)

Ngày: 30/09/2026 · Nguồn: video "AI Tự Động Copy 100% Chiến Lược SEO Của Đối Thủ Bằng n8n"
(Thanh Trần — 5 Phút AI, 27 phút, đọc trọn phụ đề) + 3 workflow n8n người dùng gửi:
`250905 Competitor_Analysis_Flow`, `250905 Internal_Linking_Flow`, `251014 SEO FULL TREND POST`.
Các video còn lại trong danh sách phát không về SEO; video "tự động viết bài" hứa ở cuối video 1
không tìm thấy trên kênh — phần viết bài đối chiếu bằng workflow TREND POST.

## 1. Chưng cất: hệ thống của họ làm gì, và VÌ SAO

**Luận điểm gốc:** đối thủ đứng top đã trả agency làm 4 việc — (1) nghiên cứu **cụm từ khoá**
(keyword cluster), (2) **lập bản đồ nội dung** cho từng cụm, (3) **mạng lưới liên kết nội bộ**
("mạng nhện" — mỗi bài dẫn sang bài liên quan trong cùng site, như blog IBM), (4) **sản xuất**
hàng trăm bài theo đúng chiến lược đó. Mất 6–12 tháng, 100–500 triệu. Ta "đảo ngược" chiến
lược của họ thay vì tự nghiên cứu từ đầu.

**Quy trình 4 bước:**

1. **Chọn đối thủ đáng học** — gõ từ khoá ngách + khu vực trên Google, bỏ quảng cáo và trang
   đặt lịch, lấy ~5 site organic top, lọc còn 3 theo **Domain Rating > 20** và **traffic tự
   nhiên** (công cụ miễn phí).
2. **Gom URL bài viết** — `domain/sitemap.xml` → chọn **đúng sitemap bài viết (post)**, bỏ
   sitemap bác sĩ, chi nhánh, dịch vụ, tuyển dụng, danh mục.
3. **Phân tích từng URL** (Competitor_Analysis_Flow) — GPT-4o-mini-search đọc trang, ra
   Chủ đề · 3 từ khoá (dài + ngắn, phải có thật trong bài) · tóm tắt gạch đầu dòng mỗi ý một
   chủ đề phụ → bảng tính, đánh dấu "Analysed=Yes" để không phân tích lại. ~0,0014 USD/URL.
4. **Rút ra chiến lược** — 3 cách đọc dữ liệu: (a) từ khoá đối thủ nhắc nhiều nhất = từ khoá họ
   dồn lực; (b) chủ đề họ viết đi viết lại = trụ cột chiến lược; (c) **phân tích cụm**
   (cách tác giả dùng "gần như mọi lúc").

**Hai prompt chiến lược (chạy bằng ChatGPT thủ công, KHÔNG nằm trong n8n):**

- **Cluster analysis:** đưa toàn bộ bảng phân tích → xếp các bài thành cụm nội dung
  (tên cụm → danh sách bài). Chạy cho đối thủ VÀ cho chính mình. Rồi: "cụm của tôi, cụm của
  đối thủ, dịch vụ của tôi → 10 cụm tôi nên tập trung".
- **Gap analysis:** so danh sách bài của mình với của đối thủ, có **trọng số theo tầm quan
  trọng của từng dịch vụ** → những bài nên viết.

**Kho bài của chính mình (Internal_Linking_Flow):** y hệt luồng phân tích đối thủ nhưng chạy
trên bài ĐÃ ĐĂNG của mình → danh mục (tiêu đề, từ khoá, tóm tắt, URL). Danh mục này là nguyên
liệu để mỗi bài mới liên kết về bài cũ.

**Bảng "Cluster" = kế hoạch nội dung:** mỗi dòng là một bài SẼ viết: mục đích, từ khoá chính,
từ khoá phụ, cụm. 150 dòng × 1 bài/tuần = 3 năm nội dung. Workflow viết bài đọc từ bảng này.

**Sản xuất (SEO FULL TREND POST, thứ Năm 08:00 mỗi tuần, 1 bài):**
Google Trends (SerpAPI, VN, 3 ngày, *rising* + *top*) → 2 truy vấn tăng mạnh nhất + nhóm từ khoá
lượng tìm cao (điểm > 30) làm từ khoá phụ → GPT chọn 1 đề tài hợp thương hiệu →
**Perplexity sonar-pro nghiên cứu có trích nguồn** → nối nguồn vào chữ → **Claude viết
1.500–2.000 từ, dẫn URL nguồn** → đọc danh mục bài cũ → GPT **chèn ≥ 5 liên kết nội bộ** đúng
chỗ, không đổi nội dung → dựng Markdown theo khuôn (H1 có từ khoá, đoạn dẫn, thời gian đọc,
**Điểm chính**, **Mục lục** có neo, thân bài, **FAQ**) → slug (≤ 5 từ, có từ khoá) → tiêu đề →
meta 150–160 ký tự (từ khoá chính + phụ) → ảnh bìa (Google Images) → Drive + email "sẵn sàng
đăng" → **ghi vào danh mục bài đã làm** (danh mục tự lớn lên sau mỗi bài).

## 2. Đối chiếu với Rada SEO hiện tại (sau kế hoạch 2B-1)

### 2.1 Phân tích đối thủ, tìm khoảng trống

| Khâu | ai5phut | Rada SEO | Nhận xét |
|---|---|---|---|
| Chọn đối thủ | Google top organic, lọc DR > 20 + traffic | Người quản trị tự gõ tên miền | Thiếu tiêu chí chọn — dễ thêm "đối thủ" không đáng học |
| Gom URL | Thủ công qua ChatGPT, **chỉ sitemap bài viết** | **Tự động** (robots + sitemap index, mới nhất trước) | Rada hơn ở tự động, nhưng **gom cả sitemap bác sĩ/dịch vụ/danh mục** |
| Lọc ngách | Không | Lọc Đông y trước khi tốn AI | Rada hơn |
| Phân tích trang | GPT-search: chủ đề · 3 từ khoá · tóm tắt | Claude qua MCP: cùng 3 trường | Ngang nhau |
| Phân tích **của mình** | Chạy cùng luồng trên bài đã đăng | Chỉ khi thêm site mình như "đối thủ, của mình" và quét sitemap | Rada **bỏ quên kho thật của mình**: 18.425 trang từ điển + bài blog trong CMS đã có dữ liệu cấu trúc, không cần quét |
| **Phân cụm** | Prompt cluster analysis (AI xếp cụm theo nghĩa) | Gom nhóm bằng **cặp từ trùng** (Jaccard ≥ 0,30) | Rada chỉ bắt được bài **trùng chữ**; "bấm huyệt trị mất ngủ" và "an thần bằng huyệt Thần Môn" là một cụm nhưng thước chữ không thấy |
| Khoảng trống | Prompt gap analysis **có trọng số theo dịch vụ** | Luật: số đối thủ × 3 + số bài + xu hướng − phạt | Rada thiếu **trọng số theo dịch vụ/sản phẩm của mình** (đo kinh lạc, phần mềm, từ điển) |

### 2.2 Đề xuất chủ đề để triển khai

| Khâu | ai5phut | Rada SEO | Nhận xét |
|---|---|---|---|
| Tín hiệu nhu cầu | Google Trends rising/top **có điểm tăng trưởng** | Google Suggest (chỉ có/không, không điểm) | Rada thiếu độ lớn nhu cầu |
| Chọn đề tài | AI chọn 1/tuần, ràng buộc thương hiệu | Danh sách cụm xếp theo điểm luật | Rada **không có "bài dự kiến"**: có cụm nhưng không có bài cụ thể, từ khoá chính/phụ, mục đích |
| Kế hoạch nội dung | Bảng Cluster: bài · mục đích · từ khoá chính · phụ · cụm | Không có | **Thiếu hẳn tầng "content map"** — tầng agency làm và người duyệt dễ duyệt nhất |
| Nghiên cứu trước khi viết | Perplexity có trích nguồn | Chưa có (2B-2 dự tính viết thẳng) | Không nghiên cứu thì bài y khoa dựa trí nhớ mô hình — trái rào "không bịa" của chính Rada |

### 2.3 Liên kết nội bộ

| Khâu | ai5phut | Rada SEO | Nhận xét |
|---|---|---|---|
| Danh mục đích | Bảng bài đã đăng (tiêu đề, từ khoá, tóm tắt, URL) | Chưa có danh mục; chỉ có `locLink` **gỡ** link chết | Rada chỉ biết **chặn** link sai, chưa biết **đề xuất** link đúng |
| Chèn link bài mới → bài cũ | AI chèn ≥ 5 link đúng chỗ | Chưa có | — |
| Bài cũ → bài mới | Không | Không | Cả hai thiếu: mạng nhện chỉ mọc một chiều |
| Trụ cột (pillar) | Ngầm qua cụm | Không | Site ta có sẵn trụ cột tự nhiên: trang kinh, trang bệnh học, trang bài thuốc gốc |

### 2.4 Chỗ Rada ĐÃ hơn — giữ nguyên

- Tự gom URL từ sitemap (họ copy tay qua ChatGPT); lọc ngách trước khi tốn AI.
- Rào **phạm vi Y sỹ**, YMYL, chống trùng blog + **trùng từ điển** — họ không có vì ngành họ
  không phải y.
- **Ảnh lấy từ thư viện của chính site.** Họ lấy ảnh đầu tiên của Google Images → rủi ro bản
  quyền và sai nội dung.
- Người duyệt duyệt **trong CMS** có phiếu chấm; họ nhận email rồi dán tay lên Substack.
- Không khoá API: AI chạy bằng gói Claude qua MCP, khoá phạm vi hẹp.

## 3. Kết luận — vì sao "chưa sát mục tiêu"

Rada đang mạnh ở **đầu vào** (gom và đọc trang đối thủ) nhưng thiếu ba tầng mà cả video lẫn
workflow coi là cốt lõi:

1. **Phân cụm theo NGHĨA** cho cả đối thủ lẫn mình → cụm nên tập trung, có trọng số dịch vụ.
2. **Kế hoạch nội dung (content map):** mỗi dòng một bài dự kiến — từ khoá chính, từ khoá phụ,
   mục đích, cụm, trang trụ cột, các link nội bộ đích. Đây là thứ người quản trị duyệt nhanh
   nhất, và là đầu vào cho viết bài.
3. **Mạng liên kết nội bộ:** danh mục đích (từ điển + blog) → chèn link khi viết + gợi ý chèn
   ngược từ bài cũ.

Danh sách "khoảng trống" bằng luật hiện tại nên **hạ xuống làm bằng chứng** (bao nhiêu đối thủ
viết, trang nào) cho tầng phân cụm, không phải sản phẩm cuối.
