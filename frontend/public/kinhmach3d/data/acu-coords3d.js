/* Toạ độ huyệt 3D — ENGINE cốt-độ 5 TẦNG + RẢI DỌC ĐƯỜNG KINH (backend/src/acu-solver).
 *  Tầng 1 mốc/chấm tay · 2 WHO 2008 · 3 sách VỊ TRÍ + cốt độ · 4 khe mô · 5 ép lên da
 *  · rồi RẢI LẠI theo cốt độ dọc đường kinh (bake-points.cjs) — đường dựng bởi bake-paths.cjs.
 *  src có hậu tố '+duong' = đã rải dọc đường · truocRai = toạ độ trước khi rải · raiCm = quãng dời.
 *  q=exact (≥2 nguồn) · approx (1 nguồn, hoặc bị dời xa → xem canSoat).
 *  GV vẫn là cực toạ độ {h,az} — chưa qua engine.
 *  Sinh lại: node bake.cjs → node bake-paths.cjs → node bake-points.cjs */
window.ACU_COORDS3D = {
  "meridians": {
    "LU": {
      "name": "Phế",
      "color": "#e11d48"
    },
    "LI": {
      "name": "Đại Trường",
      "color": "#f97316"
    },
    "ST": {
      "name": "Vị",
      "color": "#eab308"
    },
    "SP": {
      "name": "Tỳ",
      "color": "#84cc16"
    },
    "HT": {
      "name": "Tâm",
      "color": "#dc2626"
    },
    "SI": {
      "name": "Tiểu Trường",
      "color": "#fb7185"
    },
    "BL": {
      "name": "Bàng Quang",
      "color": "#2563eb"
    },
    "KI": {
      "name": "Thận",
      "color": "#0ea5e9"
    },
    "PC": {
      "name": "Tâm Bào",
      "color": "#db2777"
    },
    "TE": {
      "name": "Tam Tiêu",
      "color": "#a855f7"
    },
    "GB": {
      "name": "Đởm",
      "color": "#16a34a"
    },
    "LR": {
      "name": "Can",
      "color": "#15803d"
    },
    "CV": {
      "name": "Mạch Nhâm",
      "color": "#c026d3"
    },
    "GV": {
      "name": "Mạch Đốc",
      "color": "#0891b2"
    }
  },
  "points": {
    "LU1": {
      "x": 0.0552,
      "y": 0.7904,
      "z": 0.0483,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "LU2": {
      "x": 0.0512,
      "y": 0.8025,
      "z": 0.0406,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "LU3": {
      "x": 0.1303,
      "y": 0.7272,
      "z": 0.0006,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU4": {
      "x": 0.1309,
      "y": 0.7138,
      "z": 0.0017,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU5": {
      "x": 0.1345,
      "y": 0.6518,
      "z": 0.003,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU6": {
      "x": 0.1475,
      "y": 0.5934,
      "z": 0.009,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU7": {
      "x": 0.1588,
      "y": 0.5314,
      "z": 0.0128,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU8": {
      "x": 0.1611,
      "y": 0.5263,
      "z": 0.0143,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU9": {
      "x": 0.1658,
      "y": 0.5166,
      "z": 0.0215,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU10": {
      "x": 0.186,
      "y": 0.4984,
      "z": 0.022,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LU11": {
      "x": 0.1849,
      "y": 0.4671,
      "z": 0.0376,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI1": {
      "x": 0.182,
      "y": 0.4363,
      "z": 0.0426,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI2": {
      "x": 0.1797,
      "y": 0.462,
      "z": 0.0225,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.5cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai."
    },
    "LI3": {
      "x": 0.1798,
      "y": 0.4683,
      "z": 0.0225,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.5cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai."
    },
    "LI4": {
      "x": 0.1803,
      "y": 0.4833,
      "z": 0.0153,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI5": {
      "x": 0.1706,
      "y": 0.5157,
      "z": 0.0127,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI6": {
      "x": 0.1604,
      "y": 0.5492,
      "z": 0.0046,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI7": {
      "x": 0.156,
      "y": 0.5732,
      "z": 0.0068,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI8": {
      "x": 0.1527,
      "y": 0.6082,
      "z": 0.0029,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI9": {
      "x": 0.1504,
      "y": 0.62,
      "z": 0.0035,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI10": {
      "x": 0.1466,
      "y": 0.6314,
      "z": 0.0031,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI11": {
      "x": 0.1426,
      "y": 0.6483,
      "z": 0.0007,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI12": {
      "x": 0.1368,
      "y": 0.6664,
      "z": 0.0002,
      "q": "approx",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe",
      "khe": "bờ ngoai xương cánh tay",
      "kheLoai": "sat-bo",
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 24.1cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · RẢI DỌC ĐƯỜNG: dời 5.02cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.1476,
        0.6703,
        -0.0266
      ],
      "raiCm": 5.02
    },
    "LI13": {
      "x": 0.1287,
      "y": 0.7031,
      "z": 0.0043,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI14": {
      "x": 0.1121,
      "y": 0.7715,
      "z": 0.0141,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI15": {
      "x": 0.1009,
      "y": 0.8128,
      "z": 0.0116,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI16": {
      "x": 0.0706,
      "y": 0.8411,
      "z": -0.0239,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI17": {
      "x": 0.0441,
      "y": 0.8562,
      "z": -0.0137,
      "q": "approx",
      "snap": true,
      "src": "who+duong",
      "conf": "WHO-lấp",
      "truocRai": [
        0.0403,
        0.865,
        -0.0123
      ],
      "raiCm": 1.67
    },
    "LI18": {
      "x": 0.0272,
      "y": 0.8776,
      "z": 0.0031,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI19": {
      "x": 0.0041,
      "y": 0.9036,
      "z": 0.0584,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LI20": {
      "x": 0.0049,
      "y": 0.9202,
      "z": 0.0472,
      "q": "approx",
      "snap": true,
      "src": "who",
      "conf": "WHO-lấp"
    },
    "ST1": {
      "x": 0.0184,
      "y": 0.94,
      "z": 0.0433,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST2": {
      "x": 0.0196,
      "y": 0.9238,
      "z": 0.0421,
      "q": "approx",
      "snap": true,
      "src": "who+duong",
      "conf": "WHO-lấp",
      "snapDir": "front",
      "truocRai": [
        0.0123,
        0.9356,
        0.0415
      ],
      "raiCm": 2.39
    },
    "ST3": {
      "x": 0.0206,
      "y": 0.9104,
      "z": 0.0412,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "snapDir": "front",
      "truocRai": [
        0.0123,
        0.9356,
        0.0415
      ],
      "raiCm": 4.55,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.55cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "ST4": {
      "x": 0.0218,
      "y": 0.8938,
      "z": 0.04,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST5": {
      "x": 0.0103,
      "y": 0.8865,
      "z": 0.0439,
      "q": "approx",
      "snap": true,
      "src": "who+khe",
      "conf": "khe",
      "khe": "bờ duoi xương hàm dưới",
      "kheLoai": "sat-bo",
      "snapDir": "front"
    },
    "ST6": {
      "x": 0.0178,
      "y": 0.8769,
      "z": 0.0312,
      "q": "approx",
      "snap": true,
      "src": "who+khe+duong",
      "conf": "khe",
      "khe": "bờ duoi xương hàm dưới",
      "kheLoai": "sat-bo",
      "snapDir": "front",
      "truocRai": [
        0.0178,
        0.8769,
        0.0312
      ],
      "raiCm": 0
    },
    "ST7": {
      "x": 0.0369,
      "y": 0.915,
      "z": 0.0171,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST8": {
      "x": 0.0372,
      "y": 0.9651,
      "z": 0.0146,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST9": {
      "x": 0.0167,
      "y": 0.8776,
      "z": 0.0387,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST10": {
      "x": 0.0167,
      "y": 0.8517,
      "z": 0.0144,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST11": {
      "x": 0.0167,
      "y": 0.8257,
      "z": 0.0307,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST12": {
      "x": 0.0435,
      "y": 0.8388,
      "z": 0.0128,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST13": {
      "x": 0.0444,
      "y": 0.8136,
      "z": 0.0335,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST14": {
      "x": 0.0444,
      "y": 0.8033,
      "z": 0.0349,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST15": {
      "x": 0.0444,
      "y": 0.7827,
      "z": 0.0588,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST16": {
      "x": 0.0444,
      "y": 0.7648,
      "z": 0.0644,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST17": {
      "x": 0.0444,
      "y": 0.7458,
      "z": 0.0741,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST18": {
      "x": 0.0444,
      "y": 0.7231,
      "z": 0.0684,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST19": {
      "x": 0.0222,
      "y": 0.702,
      "z": 0.0705,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST20": {
      "x": 0.0222,
      "y": 0.6873,
      "z": 0.0693,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST21": {
      "x": 0.0222,
      "y": 0.6725,
      "z": 0.0689,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST22": {
      "x": 0.0222,
      "y": 0.6578,
      "z": 0.069,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST23": {
      "x": 0.0222,
      "y": 0.6431,
      "z": 0.0659,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST24": {
      "x": 0.0222,
      "y": 0.6283,
      "z": 0.0645,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST25": {
      "x": 0.0222,
      "y": 0.6136,
      "z": 0.0624,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST26": {
      "x": 0.0222,
      "y": 0.5927,
      "z": 0.0614,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST27": {
      "x": 0.0223,
      "y": 0.5717,
      "z": 0.057,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST28": {
      "x": 0.0221,
      "y": 0.5508,
      "z": 0.05,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST29": {
      "x": 0.022,
      "y": 0.5298,
      "z": 0.0448,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST30": {
      "x": 0.0222,
      "y": 0.5089,
      "z": 0.0416,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "ST31": {
      "x": 0.0768,
      "y": 0.5065,
      "z": 0.0348,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "ST32": {
      "x": 0.0778,
      "y": 0.3498,
      "z": 0.0211,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "cơ thẳng đùi | cơ rộng ngoài",
      "kheLoai": "co-co",
      "kheXacNhan": true,
      "canSoat": "TẦNG DA: ép lên da, dời 3.9cm · RẢI DỌC ĐƯỜNG: dời 4.78cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0824,
        0.3769,
        0.0256
      ],
      "raiCm": 4.78
    },
    "ST33": {
      "x": 0.0713,
      "y": 0.3138,
      "z": 0.0154,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ ngoai cơ thẳng đùi (gân)",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "truocRai": [
        0.066,
        0.3271,
        0.0214
      ],
      "raiCm": 2.67
    },
    "ST34": {
      "x": 0.0679,
      "y": 0.3017,
      "z": 0.0156,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ tren xương bánh chè",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canSoat": "TẦNG DA: ép lên da, dời 2.8cm",
      "truocRai": [
        0.0659,
        0.3003,
        0.0168
      ],
      "raiCm": 0.46
    },
    "ST35": {
      "x": 0.0592,
      "y": 0.2507,
      "z": 0.0132,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "ST36": {
      "x": 0.0577,
      "y": 0.224,
      "z": 0.0108,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "xương chày | xương mác",
      "kheLoai": "xuong-xuong",
      "kheXacNhan": true,
      "truocRai": [
        0.0506,
        0.2247,
        0.0031
      ],
      "raiCm": 1.8
    },
    "ST37": {
      "x": 0.054,
      "y": 0.181,
      "z": 0.0064,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 38.0cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ",
      "truocRai": [
        0.0531,
        0.1822,
        -0.0028
      ],
      "raiCm": 1.6
    },
    "ST38": {
      "x": 0.0527,
      "y": 0.1526,
      "z": 0.0018,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "tạm",
      "canSoat": "hai bản sách lệch nhau 6.7cm — đã lấy bản cũ · RẢI DỌC ĐƯỜNG: dời 14.83cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0498,
        0.2388,
        0.0051
      ],
      "raiCm": 14.83
    },
    "ST39": {
      "x": 0.0554,
      "y": 0.1388,
      "z": -0.0015,
      "q": "approx",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe",
      "khe": "bờ ngoai cơ chày trước",
      "kheLoai": "sat-bo",
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 20.2cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · RẢI DỌC ĐƯỜNG: dời 3.36cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0712,
        0.1398,
        -0.0131
      ],
      "raiCm": 3.36
    },
    "ST40": {
      "x": 0.0625,
      "y": 0.155,
      "z": 0,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "tạm",
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 21.4cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ",
      "truocRai": [
        0.0547,
        0.154,
        -0.0068
      ],
      "raiCm": 1.79
    },
    "ST41": {
      "x": 0.045,
      "y": 0.0484,
      "z": 0.0144,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "ST42": {
      "x": 0.0597,
      "y": 0.0488,
      "z": 0.0157,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "ST43": {
      "x": 0.0694,
      "y": 0.0299,
      "z": 0.0415,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "ST44": {
      "x": 0.0711,
      "y": 0.0236,
      "z": 0.0508,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "ST45": {
      "x": 0.0826,
      "y": 0.0031,
      "z": 0.0696,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP1": {
      "x": 0.0579,
      "y": 0.005,
      "z": 0.0727,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP2": {
      "x": 0.0424,
      "y": 0.0131,
      "z": 0.0544,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP3": {
      "x": 0.0381,
      "y": 0.0108,
      "z": 0.0471,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP4": {
      "x": 0.0312,
      "y": 0.0256,
      "z": 0.0229,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP5": {
      "x": 0.0286,
      "y": 0.0314,
      "z": 0.0046,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP6": {
      "x": 0.0264,
      "y": 0.0969,
      "z": -0.0233,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ sau-trong xương chày",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canhBao": [
        "nằm trong lòng xương — phải lùi ra mặt xương"
      ],
      "canSoat": "TẦNG DA: ép lên da, dời 2.6cm · RẢI DỌC ĐƯỜNG: dời 6.33cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0629,
        0.0968,
        -0.0188
      ],
      "raiCm": 6.33
    },
    "SP7": {
      "x": 0.0215,
      "y": 0.1516,
      "z": -0.0149,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP8": {
      "x": 0.014,
      "y": 0.2017,
      "z": -0.0175,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP9": {
      "x": 0.0169,
      "y": 0.2471,
      "z": -0.0138,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP10": {
      "x": 0.0354,
      "y": 0.2997,
      "z": 0.0263,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP11": {
      "x": 0.032,
      "y": 0.378,
      "z": 0.0315,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP12": {
      "x": 0.0397,
      "y": 0.5099,
      "z": 0.0391,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP13": {
      "x": 0.0444,
      "y": 0.5236,
      "z": 0.0415,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP14": {
      "x": 0.0444,
      "y": 0.5864,
      "z": 0.0505,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP15": {
      "x": 0.0444,
      "y": 0.6136,
      "z": 0.0521,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP16": {
      "x": 0.0444,
      "y": 0.6578,
      "z": 0.0605,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP17": {
      "x": 0.0659,
      "y": 0.725,
      "z": 0.0641,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP18": {
      "x": 0.0666,
      "y": 0.7505,
      "z": 0.0638,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP19": {
      "x": 0.0666,
      "y": 0.7745,
      "z": 0.051,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP20": {
      "x": 0.0666,
      "y": 0.7984,
      "z": 0.0398,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SP21": {
      "x": 0.1062,
      "y": 0.7013,
      "z": 0.003,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "HT1": {
      "x": 0.101,
      "y": 0.777,
      "z": 0.0337,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "HT2": {
      "x": 0.1012,
      "y": 0.6905,
      "z": -0.0058,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "HT3": {
      "x": 0.1067,
      "y": 0.6533,
      "z": -0.005,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "HT4": {
      "x": 0.1368,
      "y": 0.5292,
      "z": 0.0158,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "truocRai": [
        0.1587,
        0.5312,
        0.0066
      ],
      "raiCm": 4.09,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.09cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "HT5": {
      "x": 0.1382,
      "y": 0.5236,
      "z": 0.017,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "khe": "cơ gấp cổ tay trụ (gân) | cơ gấp các ngón nông",
      "canSoat": "khe cách chỗ cốt độ chỉ ra 3.5 cm (trần 3.1 cm) — giữ nguyên toạ độ cũ, cần soát · RẢI DỌC ĐƯỜNG: dời 4.04cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.1597,
        0.5255,
        0.0078
      ],
      "raiCm": 4.04
    },
    "HT6": {
      "x": 0.1386,
      "y": 0.5183,
      "z": 0.0198,
      "q": "exact",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe-khoá",
      "khe": "cơ gấp cổ tay trụ (gân) | cơ gấp các ngón nông (gân)",
      "kheLoai": "gan-gan",
      "truocRai": [
        0.1506,
        0.5199,
        0.0212
      ],
      "raiCm": 2.09
    },
    "HT7": {
      "x": 0.1389,
      "y": 0.5146,
      "z": 0.0219,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "HT8": {
      "x": 0.1374,
      "y": 0.4785,
      "z": 0.014,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "HT9": {
      "x": 0.1316,
      "y": 0.4441,
      "z": 0.0442,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI1": {
      "x": 0.1275,
      "y": 0.4441,
      "z": 0.0409,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI2": {
      "x": 0.1253,
      "y": 0.4699,
      "z": 0.0224,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI3": {
      "x": 0.1244,
      "y": 0.475,
      "z": 0.0223,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI4": {
      "x": 0.1248,
      "y": 0.5014,
      "z": 0.0151,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI5": {
      "x": 0.1333,
      "y": 0.5139,
      "z": 0.0047,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI6": {
      "x": 0.1325,
      "y": 0.5198,
      "z": 0.0036,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "tạm",
      "truocRai": [
        0.1333,
        0.5349,
        0.0047
      ],
      "raiCm": 2.61
    },
    "SI7": {
      "x": 0.1196,
      "y": 0.5728,
      "z": -0.0072,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI8": {
      "x": 0.1128,
      "y": 0.6604,
      "z": -0.0459,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI9": {
      "x": 0.1227,
      "y": 0.7409,
      "z": -0.0494,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "truocRai": [
        0.0834,
        0.8309,
        -0.0205
      ],
      "raiCm": 17.6,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 17.6cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "SI10": {
      "x": 0.1188,
      "y": 0.8061,
      "z": -0.0469,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI11": {
      "x": 0.0476,
      "y": 0.7794,
      "z": -0.083,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI12": {
      "x": 0.047,
      "y": 0.8214,
      "z": -0.0742,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI13": {
      "x": 0.0305,
      "y": 0.8136,
      "z": -0.0761,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI14": {
      "x": 0.0336,
      "y": 0.8313,
      "z": -0.0671,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI15": {
      "x": 0.0224,
      "y": 0.8413,
      "z": -0.0677,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI16": {
      "x": 0.0297,
      "y": 0.8776,
      "z": -0.0025,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI17": {
      "x": 0.0195,
      "y": 0.8828,
      "z": 0.0112,
      "q": "approx",
      "snap": true,
      "src": "who+duong",
      "conf": "WHO-lấp",
      "truocRai": [
        0.0195,
        0.8828,
        0.0112
      ],
      "raiCm": 0
    },
    "SI18": {
      "x": 0.0326,
      "y": 0.9069,
      "z": 0.0314,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "SI19": {
      "x": 0.0382,
      "y": 0.9197,
      "z": -0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL1": {
      "x": 0.007,
      "y": 0.9499,
      "z": 0.0472,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL2": {
      "x": 0.0098,
      "y": 0.954,
      "z": 0.0475,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL3": {
      "x": 0.0112,
      "y": 0.9818,
      "z": 0.0323,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL4": {
      "x": 0.0122,
      "y": 0.9843,
      "z": 0.0298,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL5": {
      "x": 0.0117,
      "y": 0.988,
      "z": 0.0247,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL6": {
      "x": 0.0132,
      "y": 0.9941,
      "z": 0.0127,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL7": {
      "x": 0.0133,
      "y": 0.998,
      "z": -0.0095,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL8": {
      "x": 0.0116,
      "y": 0.9961,
      "z": -0.0285,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL9": {
      "x": 0.0085,
      "y": 0.9452,
      "z": -0.0723,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL10": {
      "x": 0.0171,
      "y": 0.8936,
      "z": -0.0437,
      "q": "approx",
      "snap": true,
      "src": "book+khe",
      "conf": "khe",
      "khe": "bờ ngoai cơ thang",
      "kheLoai": "sat-bo",
      "canhBao": [
        "nằm giữa bụng cơ (sâu 0.63 thốn trong khối Phần xuống của cơ thang trái)"
      ],
      "canSoat": "hai bản sách lệch nhau 5.3cm — đã lấy bản cũ"
    },
    "BL11": {
      "x": 0.0168,
      "y": 0.825,
      "z": -0.0726,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL12": {
      "x": 0.0168,
      "y": 0.8113,
      "z": -0.0738,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL13": {
      "x": 0.0168,
      "y": 0.7985,
      "z": -0.0736,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL14": {
      "x": 0.0168,
      "y": 0.7806,
      "z": -0.0771,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL15": {
      "x": 0.0168,
      "y": 0.7596,
      "z": -0.078,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL16": {
      "x": 0.0169,
      "y": 0.7435,
      "z": -0.0756,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL17": {
      "x": 0.0168,
      "y": 0.7288,
      "z": -0.0718,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL18": {
      "x": 0.0168,
      "y": 0.6969,
      "z": -0.0682,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL19": {
      "x": 0.0168,
      "y": 0.683,
      "z": -0.0654,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL20": {
      "x": 0.0168,
      "y": 0.6703,
      "z": -0.0636,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL21": {
      "x": 0.0168,
      "y": 0.6536,
      "z": -0.062,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL22": {
      "x": 0.0168,
      "y": 0.6351,
      "z": -0.0591,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL23": {
      "x": 0.0168,
      "y": 0.619,
      "z": -0.0578,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL24": {
      "x": 0.0168,
      "y": 0.6063,
      "z": -0.0573,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL25": {
      "x": 0.0168,
      "y": 0.5931,
      "z": -0.0583,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL26": {
      "x": 0.0168,
      "y": 0.5851,
      "z": -0.0606,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL27": {
      "x": 0.0168,
      "y": 0.5763,
      "z": -0.0646,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL28": {
      "x": 0.0168,
      "y": 0.5595,
      "z": -0.0717,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL29": {
      "x": 0.0168,
      "y": 0.5427,
      "z": -0.0796,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL30": {
      "x": 0.0168,
      "y": 0.5259,
      "z": -0.0821,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL31": {
      "x": 0.0046,
      "y": 0.5763,
      "z": -0.0651,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL32": {
      "x": 0.0096,
      "y": 0.5595,
      "z": -0.0698,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL33": {
      "x": 0.0067,
      "y": 0.5427,
      "z": -0.0736,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL34": {
      "x": 0.0071,
      "y": 0.5259,
      "z": -0.0778,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL35": {
      "x": 0.0056,
      "y": 0.5009,
      "z": -0.064,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL36": {
      "x": 0.0399,
      "y": 0.4827,
      "z": -0.0692,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL37": {
      "x": 0.0436,
      "y": 0.3881,
      "z": -0.0558,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL38": {
      "x": 0.06,
      "y": 0.2737,
      "z": -0.048,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL39": {
      "x": 0.0613,
      "y": 0.2579,
      "z": -0.0477,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL40": {
      "x": 0.0485,
      "y": 0.2619,
      "z": -0.0544,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL41": {
      "x": 0.0336,
      "y": 0.8113,
      "z": -0.0792,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL42": {
      "x": 0.0336,
      "y": 0.7985,
      "z": -0.079,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL43": {
      "x": 0.0336,
      "y": 0.7806,
      "z": -0.0845,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL44": {
      "x": 0.0336,
      "y": 0.7596,
      "z": -0.0836,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL45": {
      "x": 0.0336,
      "y": 0.7435,
      "z": -0.0794,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL46": {
      "x": 0.0337,
      "y": 0.7288,
      "z": -0.0781,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL47": {
      "x": 0.0336,
      "y": 0.6969,
      "z": -0.0705,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL48": {
      "x": 0.0336,
      "y": 0.683,
      "z": -0.0671,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL49": {
      "x": 0.0336,
      "y": 0.6703,
      "z": -0.0643,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL50": {
      "x": 0.0336,
      "y": 0.6536,
      "z": -0.0625,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL51": {
      "x": 0.0336,
      "y": 0.6351,
      "z": -0.0587,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL52": {
      "x": 0.0336,
      "y": 0.619,
      "z": -0.0552,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL53": {
      "x": 0.0336,
      "y": 0.5595,
      "z": -0.0745,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL54": {
      "x": 0.0336,
      "y": 0.5259,
      "z": -0.0819,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL55": {
      "x": 0.0444,
      "y": 0.2407,
      "z": -0.0573,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "khe": "bờ ? xương chày",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canhBao": [
        "nằm giữa bụng cơ (sâu 0.65 thốn trong khối Đầu trong của cơ bụng chân trái)"
      ],
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 14.3cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · RẢI DỌC ĐƯỜNG: dời 6.6cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0185,
        0.2266,
        -0.0327
      ],
      "raiCm": 6.6
    },
    "BL56": {
      "x": 0.0318,
      "y": 0.1875,
      "z": -0.0603,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL57": {
      "x": 0.0299,
      "y": 0.1519,
      "z": -0.0491,
      "q": "approx",
      "snap": true,
      "src": "who+duong",
      "conf": "WHO+khe",
      "khe": "bờ ? cơ bụng chân",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canSoat": "TẦNG DA: ép lên da, dời 4.3cm · RẢI DỌC ĐƯỜNG: dời 4.52cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0209,
        0.1547,
        -0.0245
      ],
      "raiCm": 4.52
    },
    "BL58": {
      "x": 0.031,
      "y": 0.1376,
      "z": -0.0465,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "khe": "bờ ngoai cơ bụng chân",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 40.4cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · TẦNG DA: huyệt nằm sâu — đã ép lên da, dời 4.7cm (2.0 thốn). Mốc/quy tắc sinh ra nó gần như chắc chắn sai. · RẢI DỌC ĐƯỜNG: dời 10.27cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0356,
        0.1757,
        -0.0007
      ],
      "raiCm": 10.27
    },
    "BL59": {
      "x": 0.0387,
      "y": 0.0808,
      "z": -0.0415,
      "q": "exact",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe-khoá",
      "khe": "cơ dép | cơ mác ngắn",
      "kheLoai": "co-co",
      "truocRai": [
        0.0542,
        0.0832,
        -0.035
      ],
      "raiCm": 2.91
    },
    "BL60": {
      "x": 0.0515,
      "y": 0.0286,
      "z": -0.0383,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL61": {
      "x": 0.0729,
      "y": 0.0101,
      "z": -0.0244,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.6cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai."
    },
    "BL62": {
      "x": 0.0695,
      "y": 0.0244,
      "z": -0.0244,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL63": {
      "x": 0.0744,
      "y": 0.0192,
      "z": -0.0195,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL64": {
      "x": 0.0828,
      "y": 0.0147,
      "z": -0.0005,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL65": {
      "x": 0.0996,
      "y": 0.0089,
      "z": 0.0267,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "BL66": {
      "x": 0.0997,
      "y": 0.0088,
      "z": 0.0345,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.5cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai."
    },
    "BL67": {
      "x": 0.0977,
      "y": 0.0035,
      "z": 0.0443,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI1": {
      "x": 0.0559,
      "y": 0.0046,
      "z": 0.0242,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI2": {
      "x": 0.0329,
      "y": 0.0207,
      "z": 0.004,
      "q": "approx",
      "snap": true,
      "src": "who+duong",
      "conf": "WHO-lấp",
      "truocRai": [
        0.0341,
        0.0312,
        0.0042
      ],
      "raiCm": 1.82
    },
    "KI3": {
      "x": 0.0215,
      "y": 0.0467,
      "z": -0.0197,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI4": {
      "x": 0.022,
      "y": 0.0356,
      "z": -0.0212,
      "q": "approx",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe",
      "khe": "bờ tren xương gót",
      "kheLoai": "sat-bo",
      "truocRai": [
        0.0478,
        0.0373,
        -0.0388
      ],
      "raiCm": 5.38,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 5.38cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "KI5": {
      "x": 0.0202,
      "y": 0.0391,
      "z": -0.0223,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI6": {
      "x": 0.0254,
      "y": 0.0255,
      "z": -0.0112,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI7": {
      "x": 0.0257,
      "y": 0.0805,
      "z": -0.0252,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ ? gân gót",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "truocRai": [
        0.0482,
        0.0898,
        -0.0268
      ],
      "raiCm": 4.19,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.19cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "KI8": {
      "x": 0.0258,
      "y": 0.0809,
      "z": -0.0169,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ sau xương chày",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "truocRai": [
        0.0482,
        0.0898,
        -0.0268
      ],
      "raiCm": 4.48,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.48cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "KI9": {
      "x": 0.0271,
      "y": 0.1318,
      "z": -0.0377,
      "q": "approx",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe-khoá",
      "khe": "gân gót | cơ dép",
      "kheLoai": "co-gan",
      "truocRai": [
        0.068,
        0.1528,
        -0.0426
      ],
      "raiCm": 7.95,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 7.95cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "KI10": {
      "x": 0.029,
      "y": 0.2727,
      "z": -0.0486,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI11": {
      "x": 0.0056,
      "y": 0.5089,
      "z": 0.0426,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI12": {
      "x": 0.0056,
      "y": 0.5298,
      "z": 0.0515,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI13": {
      "x": 0.0056,
      "y": 0.5508,
      "z": 0.0565,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI14": {
      "x": 0.0056,
      "y": 0.5717,
      "z": 0.0592,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI15": {
      "x": 0.0056,
      "y": 0.5927,
      "z": 0.0597,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI16": {
      "x": 0.0056,
      "y": 0.6136,
      "z": 0.0618,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI17": {
      "x": 0.0056,
      "y": 0.6431,
      "z": 0.0653,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI18": {
      "x": 0.0056,
      "y": 0.6578,
      "z": 0.0675,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI19": {
      "x": 0.0056,
      "y": 0.6725,
      "z": 0.0686,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI20": {
      "x": 0.0056,
      "y": 0.6873,
      "z": 0.0685,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI21": {
      "x": 0.0056,
      "y": 0.702,
      "z": 0.069,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI22": {
      "x": 0.0222,
      "y": 0.7231,
      "z": 0.0693,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI23": {
      "x": 0.0222,
      "y": 0.7458,
      "z": 0.0726,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI24": {
      "x": 0.0222,
      "y": 0.7648,
      "z": 0.0701,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI25": {
      "x": 0.0222,
      "y": 0.7821,
      "z": 0.0601,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI26": {
      "x": 0.0222,
      "y": 0.8033,
      "z": 0.0405,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "KI27": {
      "x": 0.0222,
      "y": 0.8063,
      "z": 0.0405,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "PC1": {
      "x": 0.0556,
      "y": 0.7481,
      "z": 0.0689,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "PC2": {
      "x": 0.1053,
      "y": 0.8005,
      "z": 0.0111,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "PC3": {
      "x": 0.1196,
      "y": 0.6518,
      "z": 0.0025,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "PC4": {
      "x": 0.1296,
      "y": 0.5694,
      "z": 0.0111,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "khe": "bờ ? cơ gấp cổ tay quay",
      "canSoat": "mô tả \"bờ ? cơ gấp cổ tay quay\" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời 0.33 thốn · RẢI DỌC ĐƯỜNG: dời 4.39cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.1516,
        0.5706,
        -0.0018
      ],
      "raiCm": 4.39
    },
    "PC5": {
      "x": 0.1384,
      "y": 0.5473,
      "z": 0.0142,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "khe": "bờ ? cơ gấp cổ tay quay (gân)",
      "canSoat": "mô tả \"bờ ? cơ gấp cổ tay quay (gân)\" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời 0.86 thốn · RẢI DỌC ĐƯỜNG: dời 3.53cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.1556,
        0.548,
        0.003
      ],
      "raiCm": 3.53
    },
    "PC6": {
      "x": 0.1428,
      "y": 0.5363,
      "z": 0.0157,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ ? cơ gấp cổ tay quay (gân)",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canhBao": [
        "nằm giữa bụng cơ (sâu 0.80 thốn trong khối Cơ duỗi cổ tay quay ngắn trái)"
      ],
      "truocRai": [
        0.1577,
        0.5368,
        0.0054
      ],
      "raiCm": 3.12,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 3.12cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt"
    },
    "PC7": {
      "x": 0.154,
      "y": 0.5146,
      "z": 0.0247,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "PC8": {
      "x": 0.1601,
      "y": 0.4698,
      "z": 0.0339,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "PC9": {
      "x": 0.1629,
      "y": 0.4255,
      "z": 0.0543,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE1": {
      "x": 0.1412,
      "y": 0.4359,
      "z": 0.0491,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE2": {
      "x": 0.1394,
      "y": 0.4679,
      "z": 0.0136,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE3": {
      "x": 0.1406,
      "y": 0.4752,
      "z": 0.0119,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE4": {
      "x": 0.143,
      "y": 0.5124,
      "z": -0.0022,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE5": {
      "x": 0.143,
      "y": 0.5304,
      "z": -0.0122,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE6": {
      "x": 0.141,
      "y": 0.5416,
      "z": -0.0146,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE7": {
      "x": 0.1358,
      "y": 0.5408,
      "z": -0.0143,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE8": {
      "x": 0.1403,
      "y": 0.5525,
      "z": -0.02,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE9": {
      "x": 0.138,
      "y": 0.5857,
      "z": -0.0332,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE10": {
      "x": 0.1224,
      "y": 0.6645,
      "z": -0.0497,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE11": {
      "x": 0.1251,
      "y": 0.676,
      "z": -0.0493,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE12": {
      "x": 0.1281,
      "y": 0.7264,
      "z": -0.0488,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE13": {
      "x": 0.1256,
      "y": 0.7775,
      "z": -0.0466,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE14": {
      "x": 0.1153,
      "y": 0.8146,
      "z": -0.0435,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE15": {
      "x": 0.0762,
      "y": 0.8386,
      "z": -0.0212,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE16": {
      "x": 0.0283,
      "y": 0.888,
      "z": -0.0194,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE17": {
      "x": 0.0346,
      "y": 0.9098,
      "z": -0.0063,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE18": {
      "x": 0.039,
      "y": 0.9183,
      "z": -0.0198,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE19": {
      "x": 0.0448,
      "y": 0.9357,
      "z": -0.0208,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE20": {
      "x": 0.0413,
      "y": 0.9442,
      "z": -0.0119,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE21": {
      "x": 0.039,
      "y": 0.9239,
      "z": -0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE22": {
      "x": 0.0401,
      "y": 0.9279,
      "z": -0.0002,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "TE23": {
      "x": 0.0308,
      "y": 0.9423,
      "z": 0.0347,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB1": {
      "x": 0.0311,
      "y": 0.9304,
      "z": 0.0311,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB2": {
      "x": 0.0375,
      "y": 0.9156,
      "z": -0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB3": {
      "x": 0.0376,
      "y": 0.9242,
      "z": 0.0171,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB4": {
      "x": 0.0387,
      "y": 0.9633,
      "z": 0.0098,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB5": {
      "x": 0.0402,
      "y": 0.9614,
      "z": 0.005,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB6": {
      "x": 0.0417,
      "y": 0.9596,
      "z": 0.0002,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB7": {
      "x": 0.0432,
      "y": 0.9578,
      "z": -0.0046,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB8": {
      "x": 0.0419,
      "y": 0.9587,
      "z": -0.0116,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB9": {
      "x": 0.0399,
      "y": 0.9587,
      "z": -0.0163,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB10": {
      "x": 0.0374,
      "y": 0.9231,
      "z": -0.0137,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB11": {
      "x": 0.0361,
      "y": 0.9145,
      "z": -0.012,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB12": {
      "x": 0.0335,
      "y": 0.9035,
      "z": -0.017,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB13": {
      "x": 0.0231,
      "y": 0.9774,
      "z": 0.0296,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB14": {
      "x": 0.0165,
      "y": 0.9648,
      "z": 0.0402,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB15": {
      "x": 0.0178,
      "y": 0.9829,
      "z": 0.0284,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB16": {
      "x": 0.0178,
      "y": 0.9861,
      "z": 0.0244,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB17": {
      "x": 0.0178,
      "y": 0.9915,
      "z": 0.0102,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB18": {
      "x": 0.0189,
      "y": 0.9952,
      "z": -0.0036,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB19": {
      "x": 0.0149,
      "y": 0.9424,
      "z": -0.0713,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB20": {
      "x": 0.0337,
      "y": 0.9,
      "z": -0.0273,
      "q": "exact",
      "snap": true,
      "src": "who",
      "conf": "WHO+khe",
      "khe": "bờ ngoai cơ thang",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canhBao": [
        "nằm giữa bụng cơ (sâu 0.85 thốn trong khối Cơ gối đầu trái)"
      ]
    },
    "GB21": {
      "x": 0.0611,
      "y": 0.8373,
      "z": -0.0088,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB22": {
      "x": 0.0966,
      "y": 0.7427,
      "z": 0.0055,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB23": {
      "x": 0.0926,
      "y": 0.7231,
      "z": 0.0091,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB24": {
      "x": 0.0443,
      "y": 0.6842,
      "z": 0.0673,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB25": {
      "x": 0.0713,
      "y": 0.6358,
      "z": -0.0198,
      "q": "approx",
      "snap": true,
      "src": "who+khe",
      "conf": "khe",
      "khe": "bờ duoi xương sườn",
      "kheLoai": "sat-bo",
      "canhBao": [
        "nằm giữa bụng cơ (sâu 0.80 thốn trong khối Cơ chéo bụng ngoài trái)"
      ]
    },
    "GB26": {
      "x": 0.0821,
      "y": 0.6086,
      "z": 0.0048,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB27": {
      "x": 0.0734,
      "y": 0.5508,
      "z": 0.0387,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB28": {
      "x": 0.0734,
      "y": 0.5452,
      "z": 0.0387,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB29": {
      "x": 0.0953,
      "y": 0.5287,
      "z": -0.0019,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB30": {
      "x": 0.0939,
      "y": 0.4948,
      "z": -0.0139,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB31": {
      "x": 0.0884,
      "y": 0.3551,
      "z": 0.0029,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB32": {
      "x": 0.082,
      "y": 0.3298,
      "z": 0.0023,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB33": {
      "x": 0.0774,
      "y": 0.3116,
      "z": 0.0041,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "cao",
      "truocRai": [
        0.0702,
        0.3129,
        -0.0007
      ],
      "raiCm": 1.5
    },
    "GB34": {
      "x": 0.0702,
      "y": 0.2499,
      "z": -0.0007,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB35": {
      "x": 0.0704,
      "y": 0.1352,
      "z": -0.0268,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB36": {
      "x": 0.0716,
      "y": 0.1389,
      "z": -0.0192,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB37": {
      "x": 0.0679,
      "y": 0.1131,
      "z": -0.0197,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ truoc xương mác",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "truocRai": [
        0.0571,
        0.1115,
        -0.0128
      ],
      "raiCm": 2.23
    },
    "GB38": {
      "x": 0.0658,
      "y": 0.0986,
      "z": -0.02,
      "q": "exact",
      "snap": true,
      "src": "book+duong",
      "conf": "khoá",
      "khe": "bờ truoc xương mác",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "truocRai": [
        0.058,
        0.0974,
        -0.0148
      ],
      "raiCm": 1.63
    },
    "GB39": {
      "x": 0.0634,
      "y": 0.0815,
      "z": -0.0204,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB40": {
      "x": 0.0728,
      "y": 0.0212,
      "z": -0.0073,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB41": {
      "x": 0.0664,
      "y": 0.0464,
      "z": 0.0109,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB42": {
      "x": 0.0814,
      "y": 0.0277,
      "z": 0.0279,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB43": {
      "x": 0.0818,
      "y": 0.0235,
      "z": 0.0381,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GB44": {
      "x": 0.0966,
      "y": 0.0063,
      "z": 0.0589,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR1": {
      "x": 0.0692,
      "y": 0.0029,
      "z": 0.0727,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR2": {
      "x": 0.06,
      "y": 0.0247,
      "z": 0.0562,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR3": {
      "x": 0.0519,
      "y": 0.0463,
      "z": 0.0247,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR4": {
      "x": 0.0329,
      "y": 0.0515,
      "z": 0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR5": {
      "x": 0.029,
      "y": 0.1297,
      "z": -0.0073,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR6": {
      "x": 0.0206,
      "y": 0.1671,
      "z": -0.0093,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR7": {
      "x": 0.0169,
      "y": 0.2471,
      "z": -0.0268,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR8": {
      "x": 0.0119,
      "y": 0.2712,
      "z": -0.014,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR9": {
      "x": 0.0143,
      "y": 0.3298,
      "z": 0.0025,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR10": {
      "x": 0.0282,
      "y": 0.4705,
      "z": 0.0357,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR11": {
      "x": 0.0295,
      "y": 0.4833,
      "z": 0.0377,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR12": {
      "x": 0.0287,
      "y": 0.4961,
      "z": 0.0371,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR13": {
      "x": 0.0764,
      "y": 0.6289,
      "z": -0.0076,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "LR14": {
      "x": 0.0438,
      "y": 0.7026,
      "z": 0.068,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "CV1": {
      "x": -0.0016,
      "y": 0.492,
      "z": 0.0076,
      "q": "approx",
      "snap": true,
      "src": "who",
      "conf": "WHO-lấp",
      "snapDir": "front"
    },
    "CV2": {
      "x": 0,
      "y": 0.5089,
      "z": 0.0462,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV3": {
      "x": 0,
      "y": 0.5298,
      "z": 0.0523,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV4": {
      "x": 0,
      "y": 0.5508,
      "z": 0.0561,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV5": {
      "x": 0,
      "y": 0.5717,
      "z": 0.0583,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV6": {
      "x": 0,
      "y": 0.5822,
      "z": 0.0606,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV7": {
      "x": 0,
      "y": 0.5927,
      "z": 0.0588,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV8": {
      "x": 0,
      "y": 0.6136,
      "z": 0.0607,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV9": {
      "x": 0,
      "y": 0.6283,
      "z": 0.0631,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV10": {
      "x": 0,
      "y": 0.6431,
      "z": 0.065,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV11": {
      "x": 0,
      "y": 0.6578,
      "z": 0.0676,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV12": {
      "x": 0,
      "y": 0.6725,
      "z": 0.0681,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV13": {
      "x": 0,
      "y": 0.6873,
      "z": 0.0677,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV14": {
      "x": 0,
      "y": 0.702,
      "z": 0.0688,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV15": {
      "x": 0,
      "y": 0.7168,
      "z": 0.0679,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV16": {
      "x": 0,
      "y": 0.7343,
      "z": 0.0666,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV17": {
      "x": 0,
      "y": 0.7458,
      "z": 0.0695,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front",
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 1.8cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai."
    },
    "CV18": {
      "x": 0,
      "y": 0.7648,
      "z": 0.0629,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV19": {
      "x": 0,
      "y": 0.7827,
      "z": 0.0552,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV20": {
      "x": -0.001,
      "y": 0.8033,
      "z": 0.0472,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV21": {
      "x": 0,
      "y": 0.8063,
      "z": 0.0414,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV22": {
      "x": 0,
      "y": 0.8153,
      "z": 0.0369,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "CV23": {
      "x": 0,
      "y": 0.8648,
      "z": 0.0159,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front",
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.7cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai."
    },
    "CV24": {
      "x": 0,
      "y": 0.8819,
      "z": 0.0481,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front"
    },
    "GV1": {
      "x": 0,
      "y": 0.4933,
      "z": -0.0647,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV2": {
      "x": 0,
      "y": 0.5066,
      "z": -0.0734,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV3": {
      "x": 0,
      "y": 0.5931,
      "z": -0.0582,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV4": {
      "x": 0,
      "y": 0.619,
      "z": -0.0559,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV5": {
      "x": 0,
      "y": 0.6351,
      "z": -0.0576,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV6": {
      "x": 0,
      "y": 0.6703,
      "z": -0.0587,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV7": {
      "x": 0,
      "y": 0.683,
      "z": -0.0591,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV8": {
      "x": 0,
      "y": 0.6969,
      "z": -0.0619,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV9": {
      "x": 0,
      "y": 0.7288,
      "z": -0.0694,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV10": {
      "x": 0.0017,
      "y": 0.7435,
      "z": -0.0695,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV11": {
      "x": 0,
      "y": 0.7596,
      "z": -0.073,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV12": {
      "x": 0,
      "y": 0.7985,
      "z": -0.069,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV13": {
      "x": 0,
      "y": 0.825,
      "z": -0.0684,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV14": {
      "x": 0,
      "y": 0.8363,
      "z": -0.0667,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV15": {
      "x": 0,
      "y": 0.9061,
      "z": -0.0544,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV16": {
      "x": 0,
      "y": 0.9145,
      "z": -0.0601,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV17": {
      "x": 0,
      "y": 0.9424,
      "z": -0.072,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV18": {
      "x": 0,
      "y": 0.9739,
      "z": -0.0641,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV19": {
      "x": 0,
      "y": 0.994,
      "z": -0.0433,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV20": {
      "x": 0,
      "y": 1,
      "z": -0.0149,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV21": {
      "x": 0,
      "y": 0.9993,
      "z": 0.0028,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV22": {
      "x": 0,
      "y": 0.9937,
      "z": 0.0179,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV23": {
      "x": 0,
      "y": 0.9892,
      "z": 0.0279,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV24": {
      "x": 0,
      "y": 0.9863,
      "z": 0.0292,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV25": {
      "x": 0,
      "y": 0.9109,
      "z": 0.0611,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV26": {
      "x": 0,
      "y": 0.9036,
      "z": 0.0526,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV27": {
      "x": 0,
      "y": 0.9003,
      "z": 0.0515,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    },
    "GV28": {
      "x": 0,
      "y": 0.9026,
      "z": 0.0468,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true
    }
  }
};
