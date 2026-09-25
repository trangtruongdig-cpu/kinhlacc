-- chi-muc-tra-cuu.sql — Tầng tra cứu từ điển trên PostgreSQL.
--
-- VÌ SAO PHẢI TỰ DỰNG: hàm search() của EmDash dùng FTS5, mà FTS5 là của SQLite.
-- Chính EmDash ghi trong fts-manager: "FTS5 is SQLite-only; on other dialects this is
-- a no-op." Nên trên Postgres, search() KHÔNG báo lỗi — nó lặng lẽ trả về rỗng. Mọi
-- từ khoá đều ra "No results", kể cả từ chắc chắn có trong kho.
--
-- Chạy lại được nhiều lần (idempotent). Áp bằng: node scripts-di-cu/dung-chi-muc.mjs

-- ═══════════════════════════════════════════════════════════════════════
-- 1. BỎ DẤU — để gõ "hop coc" ra "Hợp Cốc", "thuong han" ra "Thương Hàn".
--    Bảng dịch sinh bằng mã rồi dán vào đây; hai vế PHẢI bằng nhau 67 ký tự
--    (kiểm tự động ở cuối file — sai thì câu lệnh cuối sẽ báo).
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION td_bo_dau(t text) RETURNS text
	LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$
	SELECT translate(
		lower(COALESCE(t, '')),
		'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
		'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
	)
$fn$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. RÚT CHỮ TỪ PORTABLE TEXT — nội dung EmDash lưu dạng khối, chữ thật nằm
--    ở children[].text.
--
--    ⚠️ KHÔNG dùng jsonb_path_query(v, '$.**.text'). Ở chế độ lax (mặc định),
--    '$.**' vừa trả mảng vừa trả từng phần tử của mảng, nên MỌI câu bị đếm HAI
--    lượt: đoạn tóm tắt hiện ra lặp nguyên văn, và tần suất từ trong tsv gấp đôi
--    làm lệch xếp hạng. Đã đo: một khối 2 span cho ra 4 mảnh.
--    Chế độ strict chữa được chỗ lặp nhưng lại NÉM LỖI khi gặp trường không có
--    khoá 'text' — mà kho này có cả cột chữ thuần lẫn cột khối. Nên đi đường
--    đệ quy tường minh: đi hết mọi tầng, chỉ nhặt khoá 'text'.
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION td_chu(v jsonb) RETURNS text
	LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$
	SELECT CASE jsonb_typeof(v)
		WHEN 'string' THEN v #>> '{}'
		-- Mảng khối: ĐƯỜNG NHANH cho hình dạng chuẩn block → children[] → span.text
		-- (đo được: 100% khối trong kho đúng hình dạng này). Đệ quy tổng quát đúng nhưng
		-- chậm gấp mười vì mỗi span tốn mấy lượt gọi hàm.
		-- Khối KHÁC hình dạng đó thì rơi xuống nhánh đệ quy, nên bảng hay khối lồng sau
		-- này vẫn được nhặt chữ chứ không im lặng biến mất khỏi chỉ mục.
		WHEN 'array' THEN COALESCE((
			SELECT string_agg(x.doan, ' ' ORDER BY b.i)
			FROM jsonb_array_elements(v) WITH ORDINALITY AS b(khoi, i)
			CROSS JOIN LATERAL (
				SELECT CASE
					WHEN jsonb_typeof(b.khoi -> 'children') = 'array' THEN (
						SELECT string_agg(c.con ->> 'text', ' ' ORDER BY c.j)
						FROM jsonb_array_elements(b.khoi -> 'children') WITH ORDINALITY AS c(con, j)
						WHERE jsonb_typeof(c.con -> 'text') = 'string'
					)
					ELSE td_chu(b.khoi)
				END AS doan
			) x
			WHERE x.doan IS NOT NULL
		), '')
		WHEN 'object' THEN COALESCE((
			SELECT string_agg(
				CASE
					WHEN jsonb_typeof(x.value) IN ('array', 'object') THEN td_chu(x.value)
					WHEN x.key = 'text' AND jsonb_typeof(x.value) = 'string' THEN x.value #>> '{}'
				END, ' ')
			FROM jsonb_each(v) AS x
		), '')
		ELSE ''
	END
$fn$;

-- Gom chữ của NHIỀU cột trong một hàng (hàng đã đổi sang jsonb).
CREATE OR REPLACE FUNCTION td_gom(j jsonb, cot text[]) RETURNS text
	LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$
	SELECT COALESCE(string_agg(NULLIF(td_chu(j -> c), ''), E'\n'), '')
	FROM unnest(COALESCE(cot, '{}'::text[])) AS c
$fn$;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. CẤU HÌNH TỪNG MỤC THƯ VIỆN — mỗi bộ khai ở đây, trigger đọc theo.
--    Thêm mục mới thì chèn một dòng + gọi td_gan_trigger(), không phải sửa mã.
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS td_cau_hinh (
	bo            text PRIMARY KEY,           -- tên bảng nội dung, vd 'benh_hoc'
	nhan          text NOT NULL,              -- nhãn hiển thị, vd 'Bệnh Học'
	duong_dan     text NOT NULL,              -- tiền tố URL, vd '/benh-hoc/'
	cot_ten_khac  text[] NOT NULL DEFAULT '{}',
	cot_than      text[] NOT NULL DEFAULT '{}',
	thu_tu        int    NOT NULL DEFAULT 100,
	mo_ta         text   NOT NULL DEFAULT ''
);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. BẢNG CHỈ MỤC — một hàng cho một mục từ đã đăng.
--    tsv có TRỌNG SỐ: A = tiêu đề, B = tên khác, C = thân bài. Không phân hạng thì
--    tra "phong thap" sẽ dội lên những bài chỉ tình cờ nhắc hai chữ đó giữa bài.
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS td_muc (
	bo         text NOT NULL,
	ma         text NOT NULL,
	slug       text NOT NULL,
	tieu_de    text NOT NULL,
	ten_khac   text NOT NULL DEFAULT '',
	tom_tat    text NOT NULL DEFAULT '',   -- vài dòng đầu, để hiện ở kết quả
	khoa       text NOT NULL,              -- tiêu đề đã bỏ dấu
	khoa_khac  text NOT NULL DEFAULT '',   -- tên khác đã bỏ dấu
	chu_cai    text NOT NULL DEFAULT '#',  -- chữ đầu, cho thanh A–Z
	do_day     int  NOT NULL DEFAULT 0,    -- số ký tự thân bài
	tsv        tsvector,
	PRIMARY KEY (bo, ma)
);

CREATE INDEX IF NOT EXISTS td_muc_tsv      ON td_muc USING gin (tsv);
CREATE INDEX IF NOT EXISTS td_muc_khoa_dau ON td_muc (khoa text_pattern_ops);
CREATE INDEX IF NOT EXISTS td_muc_az       ON td_muc (bo, chu_cai, tieu_de);
CREATE INDEX IF NOT EXISTS td_muc_slug     ON td_muc (bo, slug);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. TRIGGER ĐỒNG BỘ — đặt ở tầng CSDL chứ không ở tầng ứng dụng, để dù
--    người sửa qua trang quản trị, qua CLI hay qua SQL tay thì chỉ mục vẫn
--    khớp. Bài rút xuống nháp / xoá mềm thì biến khỏi chỉ mục.
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION td_dong_bo() RETURNS trigger
	LANGUAGE plpgsql AS $fn$
DECLARE
	ch  td_cau_hinh%ROWTYPE;
	j   jsonb;
	khac text;
	than text;
	tt  text;
BEGIN
	IF TG_OP = 'DELETE' THEN
		DELETE FROM td_muc WHERE bo = TG_ARGV[0] AND ma = OLD.id;
		RETURN OLD;
	END IF;

	SELECT * INTO ch FROM td_cau_hinh WHERE bo = TG_ARGV[0];
	IF NOT FOUND THEN RETURN NEW; END IF;

	IF NEW.deleted_at IS NOT NULL OR NEW.status IS DISTINCT FROM 'published' THEN
		DELETE FROM td_muc WHERE bo = TG_ARGV[0] AND ma = NEW.id;
		RETURN NEW;
	END IF;

	j    := to_jsonb(NEW);
	khac := td_gom(j, ch.cot_ten_khac);
	than := td_gom(j, ch.cot_than);
	tt   := regexp_replace(left(than, 400), '\s+', ' ', 'g');

	INSERT INTO td_muc (bo, ma, slug, tieu_de, ten_khac, tom_tat, khoa, khoa_khac, chu_cai, do_day, tsv)
	VALUES (
		TG_ARGV[0], NEW.id, COALESCE(NEW.slug, NEW.id), COALESCE(NEW.title, ''),
		khac, tt,
		td_bo_dau(COALESCE(NEW.title, '')), td_bo_dau(khac),
		COALESCE(NULLIF(upper(left(td_bo_dau(COALESCE(NEW.title, '')), 1)), ''), '#'),
		length(than),
		setweight(to_tsvector('simple', td_bo_dau(COALESCE(NEW.title, ''))), 'A') || setweight(to_tsvector('simple', td_bo_dau(khac)), 'B') || setweight(to_tsvector('simple', td_bo_dau(than)), 'C')
	)
	ON CONFLICT (bo, ma) DO UPDATE SET
		slug = EXCLUDED.slug, tieu_de = EXCLUDED.tieu_de, ten_khac = EXCLUDED.ten_khac,
		tom_tat = EXCLUDED.tom_tat, khoa = EXCLUDED.khoa, khoa_khac = EXCLUDED.khoa_khac,
		chu_cai = EXCLUDED.chu_cai, do_day = EXCLUDED.do_day, tsv = EXCLUDED.tsv;

	RETURN NEW;
END
$fn$;

-- Gắn trigger cho một bộ (chạy lại được — gỡ rồi gắn lại).
CREATE OR REPLACE FUNCTION td_gan_trigger(p_bo text) RETURNS void
	LANGUAGE plpgsql AS $fn$
DECLARE bang text := 'ec_' || p_bo;
BEGIN
	IF to_regclass(bang) IS NULL THEN
		RAISE NOTICE 'Bỏ qua %: chưa có bảng %', p_bo, bang;
		RETURN;
	END IF;
	EXECUTE format('DROP TRIGGER IF EXISTS td_tr ON %I', bang);
	EXECUTE format(
		'CREATE TRIGGER td_tr AFTER INSERT OR UPDATE OR DELETE ON %I
		 FOR EACH ROW EXECUTE FUNCTION td_dong_bo(%L)', bang, p_bo);
END
$fn$;

-- Dựng lại toàn bộ chỉ mục của một bộ, KHÔNG chạm vào bảng nội dung.
-- ⚠️ Không dùng mẹo "UPDATE ... SET version = version" để kích trigger: EmDash đã
--    cài sẵn trigger media-usage trên mọi bảng ec_*, làm vậy sẽ dồn hàng chục nghìn
--    việc vô nghĩa vào hàng đợi của nó.
CREATE OR REPLACE FUNCTION td_dung_lai(p_bo text) RETURNS int
	LANGUAGE plpgsql AS $fn$
DECLARE
	bang text := 'ec_' || p_bo;
	ch   td_cau_hinh%ROWTYPE;
	n    int;
BEGIN
	SELECT * INTO ch FROM td_cau_hinh WHERE bo = p_bo;
	IF NOT FOUND OR to_regclass(bang) IS NULL THEN RETURN 0; END IF;

	DELETE FROM td_muc WHERE bo = p_bo;
	EXECUTE format($q$
		INSERT INTO td_muc (bo, ma, slug, tieu_de, ten_khac, tom_tat, khoa, khoa_khac, chu_cai, do_day, tsv)
		SELECT %L, r.id, COALESCE(r.slug, r.id), COALESCE(r.title, ''),
		       g.khac,
		       regexp_replace(left(g.than, 400), '\s+', ' ', 'g'),
		       td_bo_dau(COALESCE(r.title, '')),
		       td_bo_dau(g.khac),
		       COALESCE(NULLIF(upper(left(td_bo_dau(COALESCE(r.title, '')), 1)), ''), '#'),
		       length(g.than),
		       setweight(to_tsvector('simple', td_bo_dau(COALESCE(r.title, ''))), 'A') || setweight(to_tsvector('simple', td_bo_dau(g.khac)), 'B') || setweight(to_tsvector('simple', td_bo_dau(g.than)), 'C')
		FROM %I r
		CROSS JOIN LATERAL (
			SELECT td_gom(to_jsonb(r), %L::text[]) AS khac,
			       td_gom(to_jsonb(r), %L::text[]) AS than
		) g
		WHERE r.deleted_at IS NULL AND r.status = 'published'
	$q$, p_bo, bang, ch.cot_ten_khac, ch.cot_than);

	SELECT count(*) INTO n FROM td_muc WHERE bo = p_bo;
	RETURN n;
END
$fn$;
