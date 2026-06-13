"""
ml-service/app.py
FastAPI service phân loại lưỡi (Đông Y) dùng CNN MobileNetV2 đã fine-tune.
Port: ML_SERVICE_PORT (default 3002)

Trước khi chạy lần đầu, cần có model/tongue_cnn.h5:
    python train.py          # train từ ảnh curated (~2 phút)
    python train.py --source dataset   # train từ full Shezhen dataset

API:
  GET  /health       → trạng thái service
  GET  /classes      → danh sách 20 thể lưỡi + 3 alias
  POST /ml-search    → { "image": "<base64>" } → top-5 thể tương đồng
"""

import base64
import io
import logging
import os

import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="TCM Tongue ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "tongue_cnn.h5")
IMG_SIZE   = 224

CLASS_NAMES = [
    "jiankangshe", "botaishe",    "hongshe",    "zishe",      "pangdashe",
    "shoushe",     "hongdianshe", "liewenshe",  "chihenshe",  "baitaishe",
    "huangtaishe", "heitaishe",   "huataishe",  "shenquao",   "shenqutu",
    "gandanao",    "gandantu",    "piweiao",    "xinfeiao",   "xinfeitu",
]
CLASS_VI = {
    "jiankangshe": "Lưỡi Hồng Bình",   "botaishe":    "Rêu Bong Tróc",
    "hongshe":     "Lưỡi Đỏ",           "zishe":       "Lưỡi Tím / Xanh Tím",
    "pangdashe":   "Lưỡi Phì Đại",      "shoushe":     "Lưỡi Teo Nhỏ",
    "hongdianshe": "Lưỡi Điểm Đỏ",      "liewenshe":   "Lưỡi Nứt Nẻ",
    "chihenshe":   "Lưỡi Răng Cưa",     "baitaishe":   "Rêu Trắng",
    "huangtaishe": "Rêu Vàng",           "heitaishe":   "Rêu Đen",
    "huataishe":   "Rêu Trơn / Nhờn",   "shenquao":    "Vùng Thận Lõm",
    "shenqutu":    "Vùng Thận Lồi",     "gandanao":    "Vùng Can Đởm Lõm",
    "gandantu":    "Vùng Can Đởm Lồi",  "piweiao":     "Vùng Tỳ Vị Lõm",
    "xinfeiao":    "Vùng Tâm Phế Lõm",  "xinfeitu":    "Vùng Tâm Phế Lồi",
    # Alias (map sang class gần nhất)
    "nhashe":      "Lưỡi Nhạt",
    "dosamshe":    "Lưỡi Đỏ Sẫm",
    "khongreuhe":  "Không Rêu",
}
ALIAS_SRC = {"nhashe": "jiankangshe", "dosamshe": "hongshe", "khongreuhe": "jiankangshe"}

_model = None


def load_model() -> tf.keras.Model:
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"Chưa có model tại {MODEL_PATH}\n"
                "Chạy: python ml-service/train.py"
            )
        log.info("Loading %s ...", MODEL_PATH)
        _model = tf.keras.models.load_model(MODEL_PATH)
        log.info("Model loaded  input=%s  output=%s", _model.input_shape, _model.output_shape)
    return _model


def predict(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    arr = preprocess_input(np.array(img, dtype=np.float32))   # → [-1, 1]
    arr = np.expand_dims(arr, 0)
    model = load_model()
    return model.predict(arr, verbose=0)[0]   # shape (20,)


class MlSearchRequest(BaseModel):
    image: str  # base64-encoded JPEG / PNG


@app.on_event("startup")
async def startup():
    try:
        load_model()
    except RuntimeError as e:
        log.warning(str(e))


@app.get("/health")
def health():
    model_ok = os.path.exists(MODEL_PATH)
    return {
        "status": "ok" if model_ok else "model_missing",
        "service": "tongue-ml",
        "port": int(os.getenv("ML_SERVICE_PORT", 3002)),
        "model": MODEL_PATH,
        "model_loaded": _model is not None,
    }

@app.post("/reload-model")
def reload_model():
    global _model
    _model = None
    try:
        load_model()
        return {"success": True, "message": "Model reloaded from " + MODEL_PATH}
    except Exception as e:
        raise HTTPException(503, str(e))


@app.get("/classes")
def list_classes():
    classes = [{"id": c, "vi": CLASS_VI[c]} for c in CLASS_NAMES]
    for alias, src in ALIAS_SRC.items():
        classes.append({"id": alias, "vi": CLASS_VI[alias], "alias_of": src})
    return classes


@app.post("/ml-search")
def ml_search(body: MlSearchRequest):
    if not body.image:
        raise HTTPException(400, "Thiếu dữ liệu ảnh (field: image)")

    try:
        image_bytes = base64.b64decode(body.image)
    except Exception:
        raise HTTPException(400, "Ảnh base64 không hợp lệ")

    try:
        probs = predict(image_bytes)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, f"Lỗi inference: {e}")

    # Top-5 từ 20 class chính
    results = []
    for idx, prob in enumerate(probs):
        score = round(float(prob) * 100)
        if score > 10:
            cls_id = CLASS_NAMES[idx]
            results.append({
                "id": cls_id,
                "vi": CLASS_VI[cls_id],
                "score": score,
                "reason": "Phân loại CNN (MobileNetV2 fine-tuned)",
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"similarity": results[:5], "features": {}, "source": "ml"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ML_SERVICE_PORT", "3002"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
