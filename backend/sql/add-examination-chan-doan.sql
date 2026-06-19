-- D5: lưu chẩn đoán (Hỏi & Chẩn đoán) vào ca khám.
-- Cột camelCase (đồng bộ với quy ước hiện có: "amDuong", "selectedModelIds"...).
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "chanDoan" jsonb;
