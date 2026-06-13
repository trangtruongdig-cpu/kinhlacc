"""
ml-service/build_embeddings.py
Tính lại prototype embeddings từ ảnh curated (frontend/public/tongue-atlas/)
và lưu vào model/atlas-embeddings.json.

Chạy 1 lần sau khi cài requirements:
    cd ml-service
    pip install -r requirements.txt
    python build_embeddings.py

Lưu ý:
- Ảnh nguồn: ../frontend/public/tongue-atlas/  (5 ảnh/class, đã commit)
- Dataset gốc (shezhen_datasets1.zip) KHÔNG cần có
- Kết quả model/atlas-embeddings.json được push lên git
"""

import json
import os
import logging
import numpy as np
from PIL import Image
import tensorflow as tf

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

ROOT = os.path.dirname(__file__)
ATLAS_INDEX = os.path.join(ROOT, "../frontend/public/tongue-atlas/atlas-index.json")
ATLAS_DIR   = os.path.join(ROOT, "../frontend/public/tongue-atlas")
OUT_FILE    = os.path.join(ROOT, "model/atlas-embeddings.json")

CLASS_VI = {
    "jiankangshe": "Lưỡi Hồng Bình",  "botaishe": "Rêu Bong Tróc",
    "hongshe":     "Lưỡi Đỏ",          "zishe":    "Lưỡi Tím / Xanh Tím",
    "pangdashe":   "Lưỡi Phì Đại",     "shoushe":  "Lưỡi Teo Nhỏ",
    "hongdianshe": "Lưỡi Điểm Đỏ",     "liewenshe":"Lưỡi Nứt Nẻ",
    "chihenshe":   "Lưỡi Răng Cưa",    "baitaishe": "Rêu Trắng",
    "huangtaishe": "Rêu Vàng",          "heitaishe": "Rêu Đen",
    "huataishe":   "Rêu Trơn / Nhờn",  "shenquao":  "Vùng Thận Lõm",
    "shenqutu":    "Vùng Thận Lồi",    "gandanao":  "Vùng Can Đởm Lõm",
    "gandantu":    "Vùng Can Đởm Lồi", "piweiao":   "Vùng Tỳ Vị Lõm",
    "xinfeiao":    "Vùng Tâm Phế Lõm", "xinfeitu":  "Vùng Tâm Phế Lồi",
    "nhashe":      "Lưỡi Nhạt",        "dosamshe":  "Lưỡi Đỏ Sẫm",
    "khongreuhe":  "Không Rêu",
}
ALIAS_SRC = {"nhashe": "jiankangshe", "dosamshe": "hongshe", "khongreuhe": "jiankangshe"}


def load_model():
    log.info("Loading MobileNetV2 (first run ~20 MB)...")
    model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, pooling="avg", weights="imagenet"
    )
    log.info("MobileNetV2 ready")
    return model


def get_embedding(model, img_path: str) -> np.ndarray:
    img = Image.open(img_path).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, 0)
    emb = model(arr, training=False).numpy()[0]
    return emb


def build_prototype(embeddings: list[np.ndarray]) -> list[float]:
    proto = np.mean(embeddings, axis=0)
    proto /= (np.linalg.norm(proto) + 1e-8)
    return [round(float(v), 6) for v in proto]


def main():
    if not os.path.exists(ATLAS_INDEX):
        log.error("Không tìm thấy %s — chạy process-tongue-atlas.cjs trước", ATLAS_INDEX)
        raise SystemExit(1)

    with open(ATLAS_INDEX, encoding="utf-8") as f:
        atlas_index = json.load(f)

    model = load_model()
    result = {}
    total = 0

    for class_id, vi_name in CLASS_VI.items():
        src_id = ALIAS_SRC.get(class_id, class_id)
        url_list = atlas_index.get(src_id) or atlas_index.get(class_id) or []
        img_paths = [
            os.path.normpath(os.path.join(ATLAS_DIR, p.lstrip("/").replace("tongue-atlas/", "", 1)))
            for p in url_list
        ]
        img_paths = [p for p in img_paths if os.path.exists(p)]

        if not img_paths:
            log.warning("⚠  %s: không có ảnh", class_id)
            result[class_id] = {"vi": vi_name, "prototype": [], "count": 0}
            continue

        embeddings = []
        for p in img_paths:
            try:
                embeddings.append(get_embedding(model, p))
            except Exception as e:
                log.warning("Bỏ qua %s: %s", p, e)

        if not embeddings:
            result[class_id] = {"vi": vi_name, "prototype": [], "count": 0}
            continue

        proto = build_prototype(embeddings)
        result[class_id] = {"vi": vi_name, "prototype": proto, "count": len(embeddings)}
        total += len(embeddings)
        log.info("  ✓ %-26s %d ảnh", vi_name, len(embeddings))

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    kb = os.path.getsize(OUT_FILE) // 1024
    log.info("\n✅ Xong! %d ảnh → %d prototypes (%d KB)\n   %s", total, len(result), kb, OUT_FILE)


if __name__ == "__main__":
    main()
