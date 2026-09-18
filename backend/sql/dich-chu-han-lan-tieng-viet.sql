-- =====================================================================
-- D4: DỊCH CHỮ HÁN CÒN LẪN TRONG CÂU TIẾNG VIỆT (chuyển tự Hán-Việt)
-- ---------------------------------------------------------------------
-- Đi kèm: backend/sql/audit-rac-tu-dien.sql (mục D4)
-- Chạy:
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/dich-chu-han-lan-tieng-viet.sql
--
-- Đây KHÔNG phải rác mã hoá. Đợt nhập từ điển gốc để sót chữ Hán ở giữa
-- câu tiếng Việt: "Tiêu痞 tán kết" (痞 = bĩ), "Hành khí止呕" (止呕 = chỉ ẩu).
-- Cột ten_han / ten_khac / ten_pinyin là cột chữ Hán CHÍNH THỨC, không đụng.
--
-- Mỗi UPDATE đều kiểm giá trị cũ trong WHERE: dữ liệu đã khác thì không ghi.
--
-- Bảng tra chữ dùng trong file này:
--   痞 bĩ      透疹 thấu chẩn   止 chỉ      止呕 chỉ ẩu    止痛 chỉ thống
--   止咳 chỉ khái  止痒 chỉ dương  排脓 bài nùng  拔毒 bạt độc
--   截疟 tiệt ngược   涌吐劫痰 dũng thổ kiếp đàm
--   作 tác     腹冷痛 phúc lãnh thống   兆 triệu   厥 quyết
--   跌 điệt    亏 khuy    痪 hoán
--   赭石 giả thạch   脆针海绵 thuý châm hải miên   状 trạng
--   嫩枝叶 non chi diệp   实体 thực thể   托 thác   寒 hàn   苦 khổ
-- =====================================================================

\pset pager off
\timing on

begin;

create table if not exists vi_thuoc_bak_han_20260918  as select * from vi_thuoc;
create table if not exists cong_dung_bak_han_20260918 as select * from cong_dung;
create table if not exists chu_tri_bak_han_20260918    as select * from chu_tri;

-- ---------------------------------------------------------------------
-- 1. vi_thuoc.cong_dung_tom_tat (12 bản ghi)
-- ---------------------------------------------------------------------
update vi_thuoc set cong_dung_tom_tat = 'Táo thấp hóa đàm, Hạ nghịch chỉ ẩu, Tiêu bĩ tán kết'
where id = 145 and cong_dung_tom_tat like '%痞%';

update vi_thuoc set cong_dung_tom_tat = 'Phát biểu, Thấu chẩn, Tiêu thực, khai vị, Chỉ thống, giải độc'
where id = 187 and cong_dung_tom_tat like '%透疹%';

update vi_thuoc set cong_dung_tom_tat = 'Giải độc, Súc liễm chỉ huyết, Tiệt chẩn, Chỉ lỵ'
where id = 198 and cong_dung_tom_tat like '%止%';

update vi_thuoc set cong_dung_tom_tat = 'Tán hàn chỉ thống, Hạ nghịch chỉ ẩu, Trợ dương chỉ tả'
where id = 287 and cong_dung_tom_tat like '%止%';

update vi_thuoc set cong_dung_tom_tat = 'Táo thấp hóa đàm, Tiêu bĩ tán kết, Hành thủy hóa đàm, Giáng nghịch chỉ ố'
where id = 409 and cong_dung_tom_tat like '%痞%';

update vi_thuoc set cong_dung_tom_tat = 'Kiện tỳ lợi thấp, Thanh nhiệt, Trừ thấp, Bài nùng'
where id = 428 and cong_dung_tom_tat like '%排脓%';

update vi_thuoc set cong_dung_tom_tat = 'Hồi dương cứu nghịch, Bổ hỏa trợ dương, Tán hàn chỉ thống'
where id = 518 and cong_dung_tom_tat like '%止%';

update vi_thuoc set cong_dung_tom_tat = 'Táo thấp hóa đàm, Hạ nghịch chỉ ẩu, Tiêu bĩ tán kết'
where id = 572 and cong_dung_tom_tat like '%痞%';

update vi_thuoc set cong_dung_tom_tat = 'Táo thấp hóa đàm, Tiêu bĩ tán kết, Hành khí chỉ ẩu, Hàng nghịch chỉ ẩu'
where id = 596 and cong_dung_tom_tat like '%痞%';

update vi_thuoc set cong_dung_tom_tat = 'Thanh nhiệt giải độc, Tiêu sưng bạt độc, Bạt độc sinh cơ'
where id = 766 and cong_dung_tom_tat like '%拔毒%';

update vi_thuoc set cong_dung_tom_tat = 'Tiệt ngược, Dũng thổ kiếp đàm'
where id = 997 and cong_dung_tom_tat like '%截疟%';

update vi_thuoc set cong_dung_tom_tat = 'Chỉ tả, cầm máu, Giải độc sát trùng, Trừ đàm thấp, Trừ thấp chỉ dương'
where id = 1020 and cong_dung_tom_tat like '%止痒%';

-- ---------------------------------------------------------------------
-- 2. vi_thuoc.bo_phan_dung / tinh / vi (9 bản ghi)
--    Chữ Hán của các vị này vẫn còn nguyên ở cột ten_han (代赭石, 紫梢花,
--    水朝阳, 三丫苦, 木耳, 莲房) nên bỏ chữ Hán ở đây không mất thông tin.
-- ---------------------------------------------------------------------
update vi_thuoc set bo_phan_dung = 'khoáng (giả thạch)'
where id in (15, 460) and bo_phan_dung like '%赭石%';

update vi_thuoc set bo_phan_dung = 'toàn thể khô của động vật Thuý châm hải miên (Spongilla fragilis Leidy)'
where id = 655 and bo_phan_dung like '%脆针海绵%';

update vi_thuoc set bo_phan_dung = 'Hoa đầu trạng'
where id = 748 and bo_phan_dung like '%状%';

update vi_thuoc set bo_phan_dung = 'Non chi diệp (cành non và lá)'
where id = 768 and bo_phan_dung like '%嫩枝叶%';

update vi_thuoc set bo_phan_dung = 'Tử thực thể'
where id = 805 and bo_phan_dung like '%实体%';

update vi_thuoc set bo_phan_dung = 'Hoa thác (tức đế hoa)'
where id = 849 and bo_phan_dung like '%托%';

update vi_thuoc set tinh = 'Hàn' where id = 768 and tinh = '寒';
update vi_thuoc set vi   = 'Khổ' where id = 768 and vi   = '苦';

-- ---------------------------------------------------------------------
-- 3. cong_dung.ten_cong_dung (15 bản ghi)
--    Bảng từ vựng công dụng, tách ra từ cong_dung_tom_tat của vị thuốc
--    nên phải dịch đồng bộ với mục 1.
-- ---------------------------------------------------------------------
update cong_dung set ten_cong_dung = 'Tiêu bĩ tán kết'      where id = 684  and ten_cong_dung like '%痞%';
update cong_dung set ten_cong_dung = 'Phát biểu, thấu chẩn' where id = 735  and ten_cong_dung like '%透疹%';
update cong_dung set ten_cong_dung = 'Súc liễm chỉ huyết'   where id = 747  and ten_cong_dung like '%止%';
update cong_dung set ten_cong_dung = 'Giáng nghịch chỉ ố'   where id = 930  and ten_cong_dung like '%止%';
update cong_dung set ten_cong_dung = 'Hành khí chỉ ẩu'      where id = 931  and ten_cong_dung like '%止呕%';
update cong_dung set ten_cong_dung = 'Bài nùng'             where id = 937  and ten_cong_dung like '%排脓%';
update cong_dung set ten_cong_dung = 'Tán hàn chỉ thống'    where id = 962  and ten_cong_dung like '%止%';
update cong_dung set ten_cong_dung = 'Hạ nghịch chỉ nôn'    where id = 963  and ten_cong_dung like '%止%';
update cong_dung set ten_cong_dung = 'Trợ dương chỉ tả'     where id = 964  and ten_cong_dung like '%止%';
update cong_dung set ten_cong_dung = 'Tán hàn chỉ thống'    where id = 1058 and ten_cong_dung like '%止痛%';
update cong_dung set ten_cong_dung = 'Hóa đàm chỉ khái'     where id = 1059 and ten_cong_dung like '%止咳%';
update cong_dung set ten_cong_dung = 'Tiêu sưng bạt độc'    where id = 1096 and ten_cong_dung like '%拔毒%';
update cong_dung set ten_cong_dung = 'Tiệt ngược'           where id = 1257 and ten_cong_dung like '%截疟%';
update cong_dung set ten_cong_dung = 'Dũng thổ kiếp đàm'    where id = 1258 and ten_cong_dung like '%涌吐劫痰%';
update cong_dung set ten_cong_dung = 'Trừ thấp chỉ dương'   where id = 1276 and ten_cong_dung like '%止痒%';

-- ---------------------------------------------------------------------
-- 4. chu_tri.ten_chu_tri (8 bản ghi)
--    Đây chính là những bản ghi trước tưởng "bị rác ăn mất chữ": chữ Hán
--    nằm đúng chỗ khuyết, nên dịch ra là khôi phục được nghĩa gốc.
--    2515 và 2982 khớp với bản ghi đã có sẵn trong bảng: 2794 "Điệt đả
--    tổn thương", 1049 "Điệt đả thương tổn".
-- ---------------------------------------------------------------------
update chu_tri set ten_chu_tri = 'Khí hư tác suyễn hoặc ho lâu' where id = 942  and ten_chu_tri like '%作%';
update chu_tri set ten_chu_tri = 'Thiếu phúc lãnh thống'        where id = 1580 and ten_chu_tri like '%腹冷痛%';
update chu_tri set ten_chu_tri = 'Tiên triệu lưu sản'           where id = 2098 and ten_chu_tri like '%兆%';
update chu_tri set ten_chu_tri = 'Đàm quyết đầu thống'          where id = 2123 and ten_chu_tri like '%厥%';
update chu_tri set ten_chu_tri = 'Điệt đả tổn thương'           where id = 2515 and ten_chu_tri like '%跌%';
update chu_tri set ten_chu_tri = 'Khí hư huyết khuy'            where id = 2864 and ten_chu_tri like '%亏%';
update chu_tri set ten_chu_tri = 'Điệt đả thương'               where id = 2982 and ten_chu_tri like '%跌%';
update chu_tri set ten_chu_tri = 'Ma mộc thán hoán'             where id = 3423 and ten_chu_tri like '%痪%';

-- ---------------------------------------------------------------------
-- 5. KIỂM CHỨNG
-- ---------------------------------------------------------------------
\echo
\echo '=== Còn chữ Hán trong cột tiếng Việt (phải 0) ====================='
\echo

select 'vi_thuoc.cong_dung_tom_tat' as cot, count(*) from vi_thuoc where cong_dung_tom_tat ~ '[一-鿿]'
union all select 'vi_thuoc.bo_phan_dung', count(*) from vi_thuoc where bo_phan_dung ~ '[一-鿿]'
union all select 'vi_thuoc.tinh',         count(*) from vi_thuoc where tinh ~ '[一-鿿]'
union all select 'vi_thuoc.vi',           count(*) from vi_thuoc where vi ~ '[一-鿿]'
union all select 'cong_dung.ten_cong_dung (còn lại là bản ghi TRỘN, xử lý riêng)', count(*) from cong_dung where ten_cong_dung ~ '[一-鿿]'
union all select 'chu_tri.ten_chu_tri',   count(*) from chu_tri where ten_chu_tri ~ '[一-鿿]'
order by 2 desc;

\echo
\echo '=== Trùng lặp sinh ra sau khi dịch (bảng từ vựng cong_dung) ======='
\echo

select lower(ten_cong_dung) as ten, count(*) as so_ban_ghi, string_agg(id::text, ', ' order by id) as cac_id
from cong_dung
group by lower(ten_cong_dung)
having count(*) > 1
order by 2 desc, 1
limit 20;

commit;

-- =====================================================================
-- CHƯA sửa được — cần tra sách gốc (rác đã ăn mất chữ, KHÔNG có chữ Hán
-- ở chỗ khuyết nên không suy ra được):
--
--   chu_tri  446  'TRỊ: t lạp chuyên trị hạ lỵ'  -> 'Bạch lạp …'?
--                 (đi cùng vi_thuoc 1152 Bạch Lạp)
--   chu_tri 1134  'Uy th'    -> ?
--   chu_tri 1463  'T tinh'   -> ?
--   chu_tri 2845  'Lạc nh'   -> ? (bảng có sẵn 'Lạc nhĩ' 1353, 'Lạc nhện'
--                 1916, 'Lạc nham' 2111 — ba ứng viên, không đủ cơ sở chọn)
--   cong_dung 524 'Nhiếp t'  -> ?
--   cong_dung 644 'Tiệt n'   -> 'Tiệt ngược'? (bảng có 1257 'Tiệt ngược'
--                 vừa dịch từ 截疟 — nhưng cũng có thể 'Tiệt nhiệt')
-- =====================================================================
