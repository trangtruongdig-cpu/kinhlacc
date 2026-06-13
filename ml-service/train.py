"""
ml-service/train.py
Fine-tune MobileNetV2 cho 20 thể lưỡi Đông Y (lazy-load, không cần 12GB RAM).
Output: model/tongue_cnn.h5

Dùng ảnh curated (nhanh ~2 phút, 115 ảnh):
    python train.py

Dùng full Shenzhen dataset (~1-3 giờ CPU, 19585 ảnh, lazy load):
    python train.py --source dataset
"""

import argparse
import json
import os
import sys
from collections import Counter

import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

ROOT       = os.path.dirname(__file__)
OUT_H5     = os.path.join(ROOT, "model", "tongue_cnn.h5")
ATLAS_IDX  = os.path.join(ROOT, "../frontend/public/tongue-atlas/atlas-index.json")
ATLAS_DIR  = os.path.join(ROOT, "../frontend/public/tongue-atlas")
DATASET_DIR = os.path.join(ROOT, "../tools/_tongue_work")

IMG_SIZE    = 224
BATCH_SIZE  = 32   # tăng lên 32 (lazy load cho phép)
EPOCHS_HEAD = 20
EPOCHS_FINE = 10

CLASS_NAMES = [
    "jiankangshe", "botaishe",    "hongshe",    "zishe",      "pangdashe",
    "shoushe",     "hongdianshe", "liewenshe",  "chihenshe",  "baitaishe",
    "huangtaishe", "heitaishe",   "huataishe",  "shenquao",   "shenqutu",
    "gandanao",    "gandantu",    "piweiao",    "xinfeiao",   "xinfeitu",
]
NUM_CLASSES = len(CLASS_NAMES)


# ─── Data loading (trả về paths + labels, không load pixel) ──────────────────

def load_curated() -> tuple[list, list]:
    """Đọc đường dẫn ảnh từ atlas-index.json (5 ảnh/class = 115 ảnh)."""
    if not os.path.exists(ATLAS_IDX):
        sys.exit(f"Không tìm thấy {ATLAS_IDX}")
    with open(ATLAS_IDX, encoding="utf-8") as f:
        index = json.load(f)
    paths, labels = [], []
    for cls_idx, cls_name in enumerate(CLASS_NAMES):
        for url in index.get(cls_name, []):
            rel  = url.lstrip("/").replace("tongue-atlas/", "", 1)
            path = os.path.normpath(os.path.join(ATLAS_DIR, rel))
            if os.path.exists(path):
                paths.append(path)
                labels.append(cls_idx)
    print(f"  Curated: {len(paths)} anh / {NUM_CLASSES} class")
    return paths, labels


def load_dataset() -> tuple[list, list]:
    """Thu thập đường dẫn ảnh từ Shenzhen YOLO dataset — KHÔNG load pixel."""
    if not os.path.exists(DATASET_DIR):
        sys.exit(f"Khong tim thay {DATASET_DIR}")
    paths, labels = [], []

    def walk(base_dir):
        for root, _dirs, files in os.walk(base_dir):
            if os.path.basename(root) != "images":
                continue
            label_dir = root.replace("images", "labels")
            for fname in files:
                if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                stem     = os.path.splitext(fname)[0]
                lbl_file = os.path.join(label_dir, stem + ".txt")
                if not os.path.exists(lbl_file):
                    continue
                with open(lbl_file) as f:
                    lines = f.readlines()
                for line in lines:
                    parts = line.strip().split()
                    if parts:
                        try:
                            cid = int(parts[0])
                        except ValueError:
                            continue
                        if 0 <= cid < NUM_CLASSES:
                            paths.append(os.path.join(root, fname))
                            labels.append(cid)
                            break   # 1 anh → 1 label

    walk(DATASET_DIR)
    print(f"  Dataset: {len(paths)} anh / {NUM_CLASSES} class")
    return paths, labels


# ─── tf.data pipeline (lazy load — dùng file paths) ─────────────────────────

def _load_and_preprocess(path_bytes, label):
    img = tf.io.read_file(path_bytes)
    img = tf.image.decode_image(img, channels=3, expand_animations=False)
    img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
    img = tf.cast(img, tf.float32)
    img = preprocess_input(img)   # → [-1, 1]
    return img, label

AUG = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.15),
    layers.RandomZoom(0.15),
    layers.RandomBrightness(0.2),
    layers.RandomContrast(0.2),
])

def _augment(img, label):
    return AUG(img, training=True), label


def make_dataset(paths: list, labels: list, augment: bool) -> tf.data.Dataset:
    Y = tf.keras.utils.to_categorical(labels, NUM_CLASSES)
    ds = tf.data.Dataset.from_tensor_slices((paths, Y))
    ds = ds.map(_load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    if augment:
        ds = ds.map(_augment, num_parallel_calls=tf.data.AUTOTUNE)
    return ds.shuffle(2048).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


# ─── Model ───────────────────────────────────────────────────────────────────

def build_model() -> tf.keras.Model:
    base = MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3),
                       include_top=False, pooling="avg", weights="imagenet")
    base.trainable = False
    inp     = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x       = base(inp, training=False)
    x       = layers.Dense(256, activation="relu")(x)
    x       = layers.Dropout(0.5)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)
    return tf.keras.Model(inp, outputs)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["curated", "dataset"], default="curated")
    args = parser.parse_args()

    print(f"\n{'='*50}")
    print(f"  TCM Tongue CNN  |  source={args.source}")
    print(f"  Batch={BATCH_SIZE}  lazy-load  no-RAM-spike")
    print(f"{'='*50}")

    paths, labels = load_curated() if args.source == "curated" else load_dataset()
    if len(paths) < NUM_CLASSES:
        sys.exit(f"Qua it anh ({len(paths)}) - can it nhat {NUM_CLASSES} anh.")

    # 80/20 split
    idx   = np.random.permutation(len(paths))
    split = int(0.8 * len(idx))
    tr_paths = [paths[i] for i in idx[:split]]
    tr_lbs   = [labels[i] for i in idx[:split]]
    vl_paths = [paths[i] for i in idx[split:]]
    vl_lbs   = [labels[i] for i in idx[split:]]

    ds_train = make_dataset(tr_paths, tr_lbs, augment=True)
    ds_val   = make_dataset(vl_paths, vl_lbs, augment=False)

    # class_weight — cap toi da 10x de tranh gradient explosion
    counts      = Counter(tr_lbs)
    total       = len(tr_lbs)
    MAX_WEIGHT  = 10.0
    class_weight = {
        c: min(MAX_WEIGHT, total / (NUM_CLASSES * cnt))
        for c, cnt in counts.items()
    }
    print("\n  Phan bo class (tat ca):")
    for c, cnt in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"    [{c:2d}] {CLASS_NAMES[c]:<16} {cnt:>5} anh  weight={class_weight[c]:.2f}")

    model = build_model()
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
                  loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
                  metrics=["accuracy"])

    os.makedirs(os.path.dirname(OUT_H5), exist_ok=True)
    ckpt_cb  = callbacks.ModelCheckpoint(
        OUT_H5, save_best_only=True, monitor="val_accuracy", verbose=1
    )
    early_cb = callbacks.EarlyStopping(patience=6, restore_best_weights=True)

    print(f"\n[Phase 1] Training head ({EPOCHS_HEAD} epochs max)...")
    model.fit(ds_train, validation_data=ds_val,
              epochs=EPOCHS_HEAD, callbacks=[ckpt_cb, early_cb],
              class_weight=class_weight, verbose=1)

    print(f"\n[Phase 2] Fine-tune 30 layers cuoi ({EPOCHS_FINE} epochs max)...")
    base_layer = model.layers[1]
    base_layer.trainable = True
    for layer in base_layer.layers[:-30]:
        layer.trainable = False
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
                  loss="categorical_crossentropy",
                  metrics=["accuracy"])
    model.fit(ds_train, validation_data=ds_val,
              epochs=EPOCHS_FINE, callbacks=[ckpt_cb, early_cb],
              class_weight=class_weight, verbose=1)

    model.save(OUT_H5)
    size_mb = os.path.getsize(OUT_H5) / 1e6
    print(f"\nSaved {OUT_H5}  ({size_mb:.1f} MB)")
    print("Tiep theo: restart ml-service de dung model moi.")


if __name__ == "__main__":
    main()
