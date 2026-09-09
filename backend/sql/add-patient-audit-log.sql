-- Audit log để track tất cả thay đổi patient data
-- Bác sĩ/admin có thể kiểm tra lịch sử "người A đã sửa patient X vào ngày Y, thay đổi field Z từ cũ thành mới"

CREATE TABLE IF NOT EXISTS patient_audit_log (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  changed_by_admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  changed_field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Index để query nhanh
  CONSTRAINT unique_audit_time UNIQUE(patient_id, changed_field, changed_at)
);

CREATE INDEX idx_patient_audit_patient_id ON patient_audit_log(patient_id);
CREATE INDEX idx_patient_audit_changed_at ON patient_audit_log(changed_at DESC);
CREATE INDEX idx_patient_audit_admin_id ON patient_audit_log(changed_by_admin_id);

-- COMMENT để giải thích
COMMENT ON TABLE patient_audit_log IS 'Log mỗi lần thay đổi thông tin bệnh nhân (fullName, gender, dateOfBirth, address, phone, medicalHistory, notes, ...)';
