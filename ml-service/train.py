"""
ml-service/train.py
Fine-tune MobileNetV2 → phân loại 20 thể lưỡi Đông Y.
Output: model/tongue_cnn.h5  (← file này được push lên git)

Dùng ảnh curated (mặc định, nhanh ~2 phút):
    python train.py

Dùng full Shezhen dataset (chính xác hơn, cần giải nén trước):
    python train.py --source dataset
"""

import argparse
import json
import os
import sys

import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

ROOT     = os.path.dirname(__file__)
OUT_H5   = os.path.join(ROOT, "model", "tongue_cnn.h5")
ATLAS_IDX = os.path.join(ROOT, "../frontend/public/tongue-atlas/atlas-index.json")
ATLAS_DIR = os.path.join(ROOT, "../frontend/public/tongue-atlas")
DATASET_DIR = os.path.join(ROOT, "../tools/_tongue_work")

IMG_SIZE   = 224
BATCH_SIZE = 16
EPOCHS_HEAD = 20    # train chỉ classification head (base frozen)
EPOCHS_FINE  = 10   # fine-tune 30 layer cuối của base

CLASS_NAMES = [
    "jiankangshe", "botaishe",    "hongshe",    "zishe",      "pangdashe",
    "shoushe",     "hongdianshe", "liewenshe",  "chihenshe",  "baitaishe",
    "huangtaishe", "heitaishe",   "huataishe",  "shenquao",   "shenqutu",
    "gandanao",    "gandantu",    "piweiao",    "xinfeiao",   "xinfeitu",
]
NUM_CLASSES = len(CLASS_NAMES)   # 20


# ─── Data loading ────────────────────────────────────────────────────────────

def load_curated() -> tuple[list, list]:
    """Đọc 5 ảnh/class từ frontend/public/tongue-atlas/."""
    if not os.path.exists(ATLAS_IDX):
        sys.exit(f"Không tìm thấy {ATLAS_IDX}\nChạy process-tongue-atlas.cjs trước.")
    with open(ATLAS_IDX, encoding="utf-8") as f:
        index = json.load(f)
    images, labels = [], []
    for cls_idx, cls_name in enumerate(CLASS_NAMES):
        url_list = index.get(cls_name, [])
        for url in url_list:
            rel = url.lstrip("/").replace("tongue-atlas/", "", 1)
            path = os.path.normpath(os.path.join(ATLAS_DIR, rel))
            if not os.path.exists(path):
                continue
            try:
                img = Image.open(path).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
                images.append(np.array(img, dtype=np.float32))
                labels.append(cls_idx)
            except Exception:
                pass
    print(f"  Curated: {len(images)} ảnh / {NUM_CLASSES} class")
    return images, labels


def load_dataset() -> tuple[list, list]:
    """Đọc ảnh từ Shezhen YOLO dataset (tools/_tongue_work/)."""
    if not os.path.exists(DATASET_DIR):
        sys.exit(f"Không tìm thấy {DATASET_DIR}\nGiải nén shezhen_datasets1.zip trước.")
    images, labels = [], []

    def walk(base_dir):
        for root, dirs, files in os.walk(base_dir):
            if os.path.basename(root) != "images":
                continue
            label_dir = root.replace("images", "labels")
            for fname in files:
                if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                stem = os.path.splitext(fname)[0]
                lbl_file = os.path.join(label_dir, stem + ".txt")
                if not os.path.exists(lbl_file):
                    continue
                cls_ids = set()
                with open(lbl_file) as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            try:
                                cls_ids.add(int(parts[0]))
                            except ValueError:
                                pass
                for cid in cls_ids:
                    if 0 <= cid < NUM_CLASSES:
                        try:
                            img = Image.open(os.path.join(root, fname)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
                            images.append(np.array(img, dtype=np.float32))
                            labels.append(cid)
                        except Exception:
                            pass
                        break  # 1 ảnh → 1 label (class đầu tiên)

    walk(DATASET_DIR)
    print(f"  Dataset: {len(images)} ảnh / {NUM_CLASSES} class")
    return images, labels


def make_dataset(images, labels, augment: bool):
    X = preprocess_input(np.stack(images))        # → [-1, 1]
    Y = tf.keras.utils.to_categorical(labels, NUM_CLASSES)

    ds = tf.data.Dataset.from_tensor_slices((X, Y))
    if augment:
        aug = tf.keras.Sequential([
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.15),
            layers.RandomZoom(0.15),
            layers.RandomBrightness(0.2),
            layers.RandomContrast(0.2),
        ])
        ds = ds.map(lambda x, y: (aug(x, training=True), y),
                    num_parallel_calls=tf.data.AUTOTUNE)
    return ds.shuffle(512).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


# ─── Model ───────────────────────────────────────────────────────────────────

def build_model() -> tf.keras.Model:
    base = MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3),
                       include_top=False, pooling="avg", weights="imagenet")
    base.trainable = False

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)
    return tf.keras.Model(inputs, outputs)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["curated", "dataset"], default="curated")
    args = parser.parse_args()

    print(f"\n{'─'*50}")
    print(f"  TCM Tongue CNN  |  source={args.source}")
    print(f"{'─'*50}")

    images, labels = load_curated() if args.source == "curated" else load_dataset()
    if len(images) < NUM_CLASSES:
        sys.exit(f"Quá ít ảnh ({len(images)}) — cần ít nhất {NUM_CLASSES} ảnh.")

    # 80/20 split
    idx = np.random.permutation(len(images))
    split = int(0.8 * len(idx))
    train_idx, val_idx = idx[:split], idx[split:]
    tr_imgs = [images[i] for i in train_idx]
    tr_lbs  = [labels[i] for i in train_idx]
    vl_imgs = [images[i] for i in val_idx]
    vl_lbs  = [labels[i] for i in val_idx]

    ds_train = make_dataset(tr_imgs, tr_lbs, augment=True)
    ds_val   = make_dataset(vl_imgs, vl_lbs, augment=False)

    model = build_model()
    model.compile(optimizer="adam",
                  loss="categorical_crossentropy",
                  metrics=["accuracy"])
    model.summary(line_length=70)

    ckpt_cb = callbacks.ModelCheckpoint(
        OUT_H5, save_best_only=True, monitor="val_accuracy", verbose=1
    )
    early_cb = callbacks.EarlyStopping(patience=8, restore_best_weights=True)

    # Phase 1: train head, base frozen
    print(f"\n[Phase 1] Training classification head ({EPOCHS_HEAD} epochs max)...")
    model.fit(ds_train, validation_data=ds_val,
              epochs=EPOCHS_HEAD, callbacks=[ckpt_cb, early_cb], verbose=1)

    # Phase 2: fine-tune 30 layer cuối của base
    print(f"\n[Phase 2] Fine-tuning last 30 layers ({EPOCHS_FINE} epochs max)...")
    base_layer = model.layers[1]  # MobileNetV2
    base_layer.trainable = True
    for layer in base_layer.layers[:-30]:
        layer.trainable = False

    model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
                  loss="categorical_crossentropy",
                  metrics=["accuracy"])
    model.fit(ds_train, validation_data=ds_val,
              epochs=EPOCHS_FINE, callbacks=[ckpt_cb, early_cb], verbose=1)

    os.makedirs(os.path.dirname(OUT_H5), exist_ok=True)
    model.save(OUT_H5)

    size_mb = os.path.getsize(OUT_H5) / 1e6
    print(f"\n✅  Saved  {OUT_H5}  ({size_mb:.1f} MB)")
    print("    → push file này lên git: git add ml-service/model/tongue_cnn.h5")


if __name__ == "__main__":
    main()
