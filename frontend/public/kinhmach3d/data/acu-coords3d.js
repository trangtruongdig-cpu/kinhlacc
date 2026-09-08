/* Toạ độ huyệt 3D — ENGINE cốt-độ 5 TẦNG + RẢI DỌC ĐƯỜNG KINH (backend/src/acu-solver).
 *  Tầng 1 mốc/chấm tay · 2 WHO 2008 · 3 sách VỊ TRÍ + cốt độ · 4 khe mô · 5 ép lên da
 *  · rồi RẢI LẠI theo cốt độ dọc đường kinh (bake-points.cjs) — đường dựng bởi bake-paths.cjs.
 *  src có hậu tố '+duong' = đã rải dọc đường · truocRai = toạ độ trước khi rải · raiCm = quãng dời.
 *  q=exact (≥2 nguồn) · approx (1 nguồn, hoặc bị dời xa → xem canSoat).
 *  n = PHÁP TUYẾN MẶT DA tại huyệt, chuẩn hoá, hướng RA NGOÀI — lấy theo pháp tuyến của chính đường
 *    kinh chứa nó (meridian-paths.js field nrm) để chấm và ống nhấc bằng CÙNG một véc-tơ.
 *    Frontend nhấc chấm theo n; KHÔNG được nhấc theo hướng toả ra từ trục dọc thân (chấm sẽ chìm).
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
      "snapDir": "front",
      "n": [
        0.366,
        0.533,
        0.763
      ]
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
      "snapDir": "front",
      "n": [
        0.292,
        0.616,
        0.732
      ]
    },
    "LU3": {
      "x": 0.1303,
      "y": 0.7272,
      "z": 0.0006,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.595,
        0.088,
        0.799
      ]
    },
    "LU4": {
      "x": 0.1309,
      "y": 0.7138,
      "z": 0.0017,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.551,
        0.089,
        0.83
      ]
    },
    "LU5": {
      "x": 0.1345,
      "y": 0.6518,
      "z": 0.003,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.098,
        0.079,
        0.992
      ]
    },
    "LU6": {
      "x": 0.1475,
      "y": 0.5934,
      "z": 0.009,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.371,
        0.238,
        0.897
      ]
    },
    "LU7": {
      "x": 0.1588,
      "y": 0.5314,
      "z": 0.0128,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.492,
        0.494,
        0.717
      ]
    },
    "LU8": {
      "x": 0.1611,
      "y": 0.5263,
      "z": 0.0143,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.474,
        0.599,
        0.645
      ]
    },
    "LU9": {
      "x": 0.1658,
      "y": 0.5166,
      "z": 0.0215,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.403,
        0.802,
        0.441
      ]
    },
    "LU10": {
      "x": 0.186,
      "y": 0.4984,
      "z": 0.022,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.886,
        0.29,
        -0.363
      ]
    },
    "LU11": {
      "x": 0.1849,
      "y": 0.4671,
      "z": 0.0376,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.111,
        -0.615,
        -0.781
      ]
    },
    "LI1": {
      "x": 0.182,
      "y": 0.4363,
      "z": 0.0426,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.657,
        -0.546,
        -0.52
      ]
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
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.5cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai.",
      "n": [
        0.899,
        -0.25,
        -0.361
      ]
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
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.5cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai.",
      "n": [
        0.961,
        -0.025,
        -0.275
      ]
    },
    "LI4": {
      "x": 0.1803,
      "y": 0.4833,
      "z": 0.0153,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.935,
        0.234,
        -0.266
      ]
    },
    "LI5": {
      "x": 0.1706,
      "y": 0.5157,
      "z": 0.0127,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.756,
        0.619,
        -0.212
      ]
    },
    "LI6": {
      "x": 0.1604,
      "y": 0.5492,
      "z": 0.0046,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.897,
        0.388,
        0.213
      ]
    },
    "LI7": {
      "x": 0.156,
      "y": 0.5732,
      "z": 0.0068,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.815,
        0.211,
        0.539
      ]
    },
    "LI8": {
      "x": 0.1527,
      "y": 0.6082,
      "z": 0.0029,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.673,
        0.159,
        0.722
      ]
    },
    "LI9": {
      "x": 0.1504,
      "y": 0.62,
      "z": 0.0035,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.553,
        0.179,
        0.814
      ]
    },
    "LI10": {
      "x": 0.1466,
      "y": 0.6314,
      "z": 0.0031,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.508,
        0.196,
        0.839
      ]
    },
    "LI11": {
      "x": 0.1426,
      "y": 0.6483,
      "z": 0.0007,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.439,
        0.22,
        0.871
      ]
    },
    "LI12": {
      "x": 0.1383,
      "y": 0.6615,
      "z": 0.0003,
      "q": "approx",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe",
      "khe": "bờ ngoai xương cánh tay",
      "kheLoai": "sat-bo",
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 24.1cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · RẢI DỌC ĐƯỜNG: dời 5.12cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.1476,
        0.6703,
        -0.0266
      ],
      "raiCm": 5.12,
      "n": [
        0.437,
        0.18,
        0.882
      ]
    },
    "LI13": {
      "x": 0.1316,
      "y": 0.6876,
      "z": 0.0018,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.428,
        0.134,
        0.894
      ]
    },
    "LI14": {
      "x": 0.1156,
      "y": 0.7388,
      "z": 0.0078,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.406,
        0.123,
        0.906
      ]
    },
    "LI15": {
      "x": 0.1009,
      "y": 0.8128,
      "z": 0.0116,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.302,
        0.468,
        0.831
      ]
    },
    "LI16": {
      "x": 0.0706,
      "y": 0.8411,
      "z": -0.0239,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.462,
        0.868,
        0.183
      ]
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
      "raiCm": 1.67,
      "n": [
        0.731,
        0.564,
        0.384
      ]
    },
    "LI18": {
      "x": 0.0272,
      "y": 0.8776,
      "z": 0.0031,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.867,
        -0.2,
        0.456
      ]
    },
    "LI19": {
      "x": 0.0041,
      "y": 0.9036,
      "z": 0.0584,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.785,
        0.022,
        0.619
      ]
    },
    "LI20": {
      "x": 0.0049,
      "y": 0.9202,
      "z": 0.0472,
      "q": "approx",
      "snap": true,
      "src": "who",
      "conf": "WHO-lấp",
      "n": [
        0.704,
        0.403,
        0.585
      ]
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
      "snapDir": "front",
      "n": [
        0.243,
        -0.491,
        0.837
      ]
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
      "raiCm": 2.39,
      "n": [
        0.321,
        -0.465,
        0.825
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.55cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        0.385,
        -0.441,
        0.811
      ]
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
      "snapDir": "front",
      "n": [
        0.46,
        -0.409,
        0.788
      ]
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
      "snapDir": "front",
      "n": [
        0.649,
        -0.497,
        0.576
      ]
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
      "raiCm": 0,
      "n": [
        0.716,
        -0.69,
        0.11
      ]
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
      "snapDir": "front",
      "n": [
        0.937,
        -0.251,
        0.243
      ]
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
      "snapDir": "front",
      "n": [
        0.929,
        0.184,
        0.322
      ]
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
      "snapDir": "front",
      "n": [
        0.702,
        -0.321,
        0.635
      ]
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
      "snapDir": "front",
      "n": [
        0.492,
        0.139,
        0.86
      ]
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
      "snapDir": "front",
      "n": [
        0.378,
        0.465,
        0.801
      ]
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
      "snapDir": "front",
      "n": [
        0.459,
        0.638,
        0.619
      ]
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
      "snapDir": "front",
      "n": [
        0.351,
        0.636,
        0.688
      ]
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
      "snapDir": "front",
      "n": [
        0.276,
        0.585,
        0.762
      ]
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
      "snapDir": "front",
      "n": [
        0.239,
        0.474,
        0.848
      ]
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
      "snapDir": "front",
      "n": [
        0.22,
        0.297,
        0.929
      ]
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
      "snapDir": "front",
      "n": [
        0.201,
        0.037,
        0.979
      ]
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
      "snapDir": "front",
      "n": [
        0.172,
        -0.29,
        0.941
      ]
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
      "snapDir": "front",
      "n": [
        0.115,
        -0.187,
        0.976
      ]
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
      "snapDir": "front",
      "n": [
        0.113,
        -0.174,
        0.978
      ]
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
      "snapDir": "front",
      "n": [
        0.11,
        -0.161,
        0.981
      ]
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
      "snapDir": "front",
      "n": [
        0.108,
        -0.148,
        0.983
      ]
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
      "snapDir": "front",
      "n": [
        0.116,
        -0.156,
        0.981
      ]
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
      "snapDir": "front",
      "n": [
        0.124,
        -0.165,
        0.978
      ]
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
      "snapDir": "front",
      "n": [
        0.133,
        -0.173,
        0.976
      ]
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
      "snapDir": "front",
      "n": [
        0.144,
        -0.185,
        0.972
      ]
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
      "snapDir": "front",
      "n": [
        0.156,
        -0.219,
        0.963
      ]
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
      "snapDir": "front",
      "n": [
        0.169,
        -0.254,
        0.952
      ]
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
      "snapDir": "front",
      "n": [
        0.181,
        -0.288,
        0.94
      ]
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
      "snapDir": "front",
      "n": [
        0.194,
        -0.44,
        0.877
      ]
    },
    "ST31": {
      "x": 0.0768,
      "y": 0.5065,
      "z": 0.0348,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.146,
        0.029,
        0.989
      ]
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
      "raiCm": 4.78,
      "n": [
        0.686,
        -0.188,
        0.703
      ]
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
      "raiCm": 2.67,
      "n": [
        0.702,
        -0.206,
        0.682
      ]
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
      "raiCm": 0.46,
      "n": [
        0.694,
        -0.212,
        0.688
      ]
    },
    "ST35": {
      "x": 0.0592,
      "y": 0.2507,
      "z": 0.0132,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.588,
        -0.261,
        0.766
      ]
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
      "raiCm": 1.8,
      "n": [
        0.486,
        -0.228,
        0.844
      ]
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
      "raiCm": 1.6,
      "n": [
        0.342,
        -0.169,
        0.925
      ]
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
      "raiCm": 14.83,
      "n": [
        0.33,
        -0.132,
        0.935
      ]
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
      "raiCm": 3.36,
      "n": [
        0.363,
        -0.116,
        0.924
      ]
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
      "raiCm": 1.79,
      "n": [
        0.33,
        -0.132,
        0.935
      ]
    },
    "ST41": {
      "x": 0.045,
      "y": 0.0484,
      "z": 0.0144,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.184,
        0.696,
        0.694
      ]
    },
    "ST42": {
      "x": 0.0597,
      "y": 0.0488,
      "z": 0.0157,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.155,
        0.744,
        0.65
      ]
    },
    "ST43": {
      "x": 0.0694,
      "y": 0.0299,
      "z": 0.0415,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.322,
        0.515,
        0.794
      ]
    },
    "ST44": {
      "x": 0.0711,
      "y": 0.0236,
      "z": 0.0508,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.371,
        0.426,
        0.825
      ]
    },
    "ST45": {
      "x": 0.0826,
      "y": 0.0031,
      "z": 0.0696,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.156,
        -0.987,
        -0.046
      ]
    },
    "SP1": {
      "x": 0.0579,
      "y": 0.005,
      "z": 0.0727,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.698,
        -0.655,
        0.29
      ]
    },
    "SP2": {
      "x": 0.0424,
      "y": 0.0131,
      "z": 0.0544,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.874,
        -0.304,
        0.379
      ]
    },
    "SP3": {
      "x": 0.0381,
      "y": 0.0108,
      "z": 0.0471,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.916,
        -0.063,
        0.396
      ]
    },
    "SP4": {
      "x": 0.0312,
      "y": 0.0256,
      "z": 0.0229,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.925,
        0.043,
        0.378
      ]
    },
    "SP5": {
      "x": 0.0286,
      "y": 0.0314,
      "z": 0.0046,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.935,
        0.096,
        0.342
      ]
    },
    "SP6": {
      "x": 0.0263,
      "y": 0.0969,
      "z": -0.0234,
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
      "canSoat": "TẦNG DA: ép lên da, dời 2.6cm · RẢI DỌC ĐƯỜNG: dời 6.35cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0629,
        0.0968,
        -0.0188
      ],
      "raiCm": 6.35,
      "n": [
        -0.998,
        -0.014,
        0.06
      ]
    },
    "SP7": {
      "x": 0.0215,
      "y": 0.1516,
      "z": -0.0149,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.95,
        -0.131,
        0.285
      ]
    },
    "SP8": {
      "x": 0.0152,
      "y": 0.2129,
      "z": -0.0239,
      "q": "approx",
      "snap": true,
      "src": "who+duong",
      "conf": "WHO+khe",
      "khe": "bờ sau xương chày",
      "kheLoai": "sat-bo",
      "kheXacNhan": true,
      "canSoat": "TẦNG DA: ép lên da, dời 3.2cm · RẢI DỌC ĐƯỜNG: dời 7.1cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0399,
        0.2178,
        0.0088
      ],
      "raiCm": 7.1,
      "n": [
        -0.988,
        0.042,
        0.148
      ]
    },
    "SP9": {
      "x": 0.0169,
      "y": 0.2471,
      "z": -0.0138,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.99,
        -0.027,
        0.14
      ]
    },
    "SP10": {
      "x": 0.0354,
      "y": 0.2997,
      "z": 0.0263,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.768,
        -0.11,
        0.631
      ]
    },
    "SP11": {
      "x": 0.032,
      "y": 0.378,
      "z": 0.0315,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.696,
        -0.055,
        0.716
      ]
    },
    "SP12": {
      "x": 0.0397,
      "y": 0.5099,
      "z": 0.0391,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.095,
        -0.177,
        0.98
      ]
    },
    "SP13": {
      "x": 0.0444,
      "y": 0.5236,
      "z": 0.0415,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.113,
        -0.133,
        0.985
      ]
    },
    "SP14": {
      "x": 0.0444,
      "y": 0.5864,
      "z": 0.0505,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.299,
        -0.114,
        0.947
      ]
    },
    "SP15": {
      "x": 0.0444,
      "y": 0.6136,
      "z": 0.0521,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.416,
        -0.149,
        0.897
      ]
    },
    "SP16": {
      "x": 0.0444,
      "y": 0.6578,
      "z": 0.0605,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.461,
        -0.233,
        0.856
      ]
    },
    "SP17": {
      "x": 0.0659,
      "y": 0.725,
      "z": 0.0641,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.53,
        -0.128,
        0.838
      ]
    },
    "SP18": {
      "x": 0.0666,
      "y": 0.7505,
      "z": 0.0638,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.518,
        0.211,
        0.829
      ]
    },
    "SP19": {
      "x": 0.0666,
      "y": 0.7745,
      "z": 0.051,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.438,
        0.459,
        0.773
      ]
    },
    "SP20": {
      "x": 0.0666,
      "y": 0.7984,
      "z": 0.0398,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.388,
        0.565,
        0.728
      ]
    },
    "SP21": {
      "x": 0.1062,
      "y": 0.7013,
      "z": 0.003,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.525,
        -0.155,
        0.837
      ]
    },
    "HT1": {
      "x": 0.101,
      "y": 0.777,
      "z": 0.0337,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.732,
        -0.031,
        0.681
      ]
    },
    "HT2": {
      "x": 0.1012,
      "y": 0.6905,
      "z": -0.0058,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.813,
        -0.069,
        0.579
      ]
    },
    "HT3": {
      "x": 0.1067,
      "y": 0.6533,
      "z": -0.005,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.76,
        0.018,
        0.649
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.09cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.592,
        0.16,
        0.79
      ]
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
      "raiCm": 4.04,
      "n": [
        -0.543,
        0.206,
        0.814
      ]
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
      "raiCm": 2.09,
      "n": [
        -0.456,
        0.321,
        0.83
      ]
    },
    "HT7": {
      "x": 0.1389,
      "y": 0.5146,
      "z": 0.0219,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.386,
        0.403,
        0.83
      ]
    },
    "HT8": {
      "x": 0.1374,
      "y": 0.4785,
      "z": 0.014,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.295,
        0.887,
        0.355
      ]
    },
    "HT9": {
      "x": 0.1316,
      "y": 0.4441,
      "z": 0.0442,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.823,
        0.385,
        0.418
      ]
    },
    "SI1": {
      "x": 0.1275,
      "y": 0.4441,
      "z": 0.0409,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.834,
        -0.339,
        -0.435
      ]
    },
    "SI2": {
      "x": 0.1253,
      "y": 0.4699,
      "z": 0.0224,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.916,
        -0.219,
        -0.337
      ]
    },
    "SI3": {
      "x": 0.1244,
      "y": 0.475,
      "z": 0.0223,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.918,
        -0.216,
        -0.333
      ]
    },
    "SI4": {
      "x": 0.1248,
      "y": 0.5014,
      "z": 0.0151,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.931,
        -0.197,
        -0.309
      ]
    },
    "SI5": {
      "x": 0.1333,
      "y": 0.5139,
      "z": 0.0047,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.885,
        -0.29,
        -0.364
      ]
    },
    "SI6": {
      "x": 0.1325,
      "y": 0.5198,
      "z": 0.0037,
      "q": "approx",
      "snap": true,
      "src": "book+duong",
      "conf": "tạm",
      "truocRai": [
        0.1333,
        0.5349,
        0.0047
      ],
      "raiCm": 2.61,
      "n": [
        -0.898,
        -0.29,
        -0.33
      ]
    },
    "SI7": {
      "x": 0.1206,
      "y": 0.5642,
      "z": -0.0053,
      "q": "approx",
      "snap": true,
      "src": "book+khe+duong",
      "conf": "khe",
      "khe": "bờ sau xương trụ",
      "kheLoai": "sat-bo",
      "truocRai": [
        0.1559,
        0.5706,
        -0.0154
      ],
      "raiCm": 6.4,
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 6.4cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.927,
        -0.292,
        -0.235
      ]
    },
    "SI8": {
      "x": 0.1128,
      "y": 0.6604,
      "z": -0.0459,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.399,
        -0.204,
        -0.894
      ]
    },
    "SI9": {
      "x": 0.1181,
      "y": 0.7655,
      "z": -0.0518,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.397,
        0.126,
        -0.909
      ]
    },
    "SI10": {
      "x": 0.1188,
      "y": 0.8061,
      "z": -0.0469,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.561,
        0.323,
        -0.762
      ]
    },
    "SI11": {
      "x": 0.0476,
      "y": 0.7794,
      "z": -0.083,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.002,
        0.229,
        -0.973
      ]
    },
    "SI12": {
      "x": 0.047,
      "y": 0.8214,
      "z": -0.0742,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.02,
        0.319,
        -0.948
      ]
    },
    "SI13": {
      "x": 0.0305,
      "y": 0.8136,
      "z": -0.0761,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.04,
        0.43,
        -0.902
      ]
    },
    "SI14": {
      "x": 0.0336,
      "y": 0.8313,
      "z": -0.0671,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.093,
        0.549,
        -0.83
      ]
    },
    "SI15": {
      "x": 0.0224,
      "y": 0.8413,
      "z": -0.0677,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.286,
        0.609,
        -0.74
      ]
    },
    "SI16": {
      "x": 0.0297,
      "y": 0.8776,
      "z": -0.0025,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.987,
        -0.11,
        0.116
      ]
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
      "raiCm": 0,
      "n": [
        0.794,
        -0.573,
        0.202
      ]
    },
    "SI18": {
      "x": 0.0326,
      "y": 0.9069,
      "z": 0.0314,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.933,
        -0.34,
        0.115
      ]
    },
    "SI19": {
      "x": 0.0382,
      "y": 0.9197,
      "z": -0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.982,
        -0.16,
        -0.105
      ]
    },
    "BL1": {
      "x": 0.007,
      "y": 0.9499,
      "z": 0.0472,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.134,
        0.08,
        0.988
      ]
    },
    "BL2": {
      "x": 0.0098,
      "y": 0.954,
      "z": 0.0475,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.235,
        0.376,
        0.896
      ]
    },
    "BL3": {
      "x": 0.0112,
      "y": 0.9818,
      "z": 0.0323,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.305,
        0.639,
        0.706
      ]
    },
    "BL4": {
      "x": 0.0122,
      "y": 0.9843,
      "z": 0.0298,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.311,
        0.664,
        0.68
      ]
    },
    "BL5": {
      "x": 0.0117,
      "y": 0.988,
      "z": 0.0247,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.324,
        0.741,
        0.588
      ]
    },
    "BL6": {
      "x": 0.0132,
      "y": 0.9941,
      "z": 0.0127,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.337,
        0.871,
        0.358
      ]
    },
    "BL7": {
      "x": 0.0133,
      "y": 0.998,
      "z": -0.0095,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.324,
        0.945,
        -0.049
      ]
    },
    "BL8": {
      "x": 0.0116,
      "y": 0.9961,
      "z": -0.0285,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.271,
        0.743,
        -0.612
      ]
    },
    "BL9": {
      "x": 0.0085,
      "y": 0.9452,
      "z": -0.0723,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.075,
        -0.039,
        -0.996
      ]
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
      "canSoat": "hai bản sách lệch nhau 5.3cm — đã lấy bản cũ",
      "n": [
        0.565,
        -0.23,
        -0.793
      ]
    },
    "BL11": {
      "x": 0.0168,
      "y": 0.825,
      "z": -0.0726,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.043,
        0.177,
        -0.983
      ]
    },
    "BL12": {
      "x": 0.0168,
      "y": 0.8113,
      "z": -0.0738,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.072,
        0.156,
        -0.985
      ]
    },
    "BL13": {
      "x": 0.0168,
      "y": 0.7985,
      "z": -0.0736,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.1,
        0.136,
        -0.986
      ]
    },
    "BL14": {
      "x": 0.0168,
      "y": 0.7806,
      "z": -0.0771,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.138,
        0.108,
        -0.985
      ]
    },
    "BL15": {
      "x": 0.0168,
      "y": 0.7596,
      "z": -0.078,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.182,
        0.075,
        -0.98
      ]
    },
    "BL16": {
      "x": 0.0169,
      "y": 0.7435,
      "z": -0.0756,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.181,
        0.068,
        -0.981
      ]
    },
    "BL17": {
      "x": 0.0168,
      "y": 0.7288,
      "z": -0.0718,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.179,
        0.062,
        -0.982
      ]
    },
    "BL18": {
      "x": 0.0168,
      "y": 0.6969,
      "z": -0.0682,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.176,
        0.048,
        -0.983
      ]
    },
    "BL19": {
      "x": 0.0168,
      "y": 0.683,
      "z": -0.0654,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.175,
        0.042,
        -0.984
      ]
    },
    "BL20": {
      "x": 0.0168,
      "y": 0.6703,
      "z": -0.0636,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.174,
        0.036,
        -0.984
      ]
    },
    "BL21": {
      "x": 0.0168,
      "y": 0.6536,
      "z": -0.062,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.162,
        0.045,
        -0.986
      ]
    },
    "BL22": {
      "x": 0.0168,
      "y": 0.6351,
      "z": -0.0591,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.144,
        0.062,
        -0.988
      ]
    },
    "BL23": {
      "x": 0.0168,
      "y": 0.619,
      "z": -0.0578,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.128,
        0.077,
        -0.989
      ]
    },
    "BL24": {
      "x": 0.0168,
      "y": 0.6063,
      "z": -0.0573,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.116,
        0.089,
        -0.989
      ]
    },
    "BL25": {
      "x": 0.0168,
      "y": 0.5931,
      "z": -0.0583,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.116,
        0.129,
        -0.985
      ]
    },
    "BL26": {
      "x": 0.0168,
      "y": 0.5851,
      "z": -0.0606,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.116,
        0.154,
        -0.981
      ]
    },
    "BL27": {
      "x": 0.0168,
      "y": 0.5763,
      "z": -0.0646,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.129,
        0.151,
        -0.98
      ]
    },
    "BL28": {
      "x": 0.0168,
      "y": 0.5595,
      "z": -0.0717,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.153,
        0.146,
        -0.977
      ]
    },
    "BL29": {
      "x": 0.0168,
      "y": 0.5427,
      "z": -0.0796,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.178,
        0.141,
        -0.974
      ]
    },
    "BL30": {
      "x": 0.0168,
      "y": 0.5259,
      "z": -0.0821,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.26,
        0.046,
        -0.965
      ]
    },
    "BL31": {
      "x": 0.0046,
      "y": 0.5763,
      "z": -0.0651,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.25,
        0.203,
        -0.947
      ]
    },
    "BL32": {
      "x": 0.0096,
      "y": 0.5595,
      "z": -0.0698,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.295,
        0.25,
        -0.922
      ]
    },
    "BL33": {
      "x": 0.0067,
      "y": 0.5427,
      "z": -0.0736,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.371,
        0.127,
        -0.92
      ]
    },
    "BL34": {
      "x": 0.0071,
      "y": 0.5259,
      "z": -0.0778,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.405,
        -0.189,
        -0.894
      ]
    },
    "BL35": {
      "x": 0.0056,
      "y": 0.5009,
      "z": -0.064,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.336,
        -0.61,
        -0.718
      ]
    },
    "BL36": {
      "x": 0.0399,
      "y": 0.4827,
      "z": -0.0692,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.304,
        -0.427,
        -0.852
      ]
    },
    "BL37": {
      "x": 0.0436,
      "y": 0.3881,
      "z": -0.0558,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.396,
        -0.082,
        -0.915
      ]
    },
    "BL38": {
      "x": 0.06,
      "y": 0.2737,
      "z": -0.048,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.384,
        0.259,
        -0.886
      ]
    },
    "BL39": {
      "x": 0.0613,
      "y": 0.2579,
      "z": -0.0477,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.341,
        0.307,
        -0.889
      ]
    },
    "BL40": {
      "x": 0.0485,
      "y": 0.2619,
      "z": -0.0544,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.049,
        0.318,
        -0.947
      ]
    },
    "BL41": {
      "x": 0.0336,
      "y": 0.8113,
      "z": -0.0792,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.112,
        0.259,
        -0.959
      ]
    },
    "BL42": {
      "x": 0.0336,
      "y": 0.7985,
      "z": -0.079,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.146,
        0.156,
        -0.977
      ]
    },
    "BL43": {
      "x": 0.0336,
      "y": 0.7806,
      "z": -0.0845,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.136,
        0.055,
        -0.989
      ]
    },
    "BL44": {
      "x": 0.0336,
      "y": 0.7596,
      "z": -0.0836,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.061,
        0.012,
        -0.998
      ]
    },
    "BL45": {
      "x": 0.0336,
      "y": 0.7435,
      "z": -0.0794,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.049,
        0.017,
        -0.999
      ]
    },
    "BL46": {
      "x": 0.0337,
      "y": 0.7288,
      "z": -0.0781,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.038,
        0.021,
        -0.999
      ]
    },
    "BL47": {
      "x": 0.0336,
      "y": 0.6969,
      "z": -0.0705,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.014,
        0.03,
        -0.999
      ]
    },
    "BL48": {
      "x": 0.0336,
      "y": 0.683,
      "z": -0.0671,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.004,
        0.034,
        -0.999
      ]
    },
    "BL49": {
      "x": 0.0336,
      "y": 0.6703,
      "z": -0.0643,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.006,
        0.038,
        -0.999
      ]
    },
    "BL50": {
      "x": 0.0336,
      "y": 0.6536,
      "z": -0.0625,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.018,
        0.043,
        -0.999
      ]
    },
    "BL51": {
      "x": 0.0336,
      "y": 0.6351,
      "z": -0.0587,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.032,
        0.048,
        -0.998
      ]
    },
    "BL52": {
      "x": 0.0336,
      "y": 0.619,
      "z": -0.0552,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.044,
        0.053,
        -0.998
      ]
    },
    "BL53": {
      "x": 0.0336,
      "y": 0.5595,
      "z": -0.0745,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.112,
        0.088,
        -0.99
      ]
    },
    "BL54": {
      "x": 0.0336,
      "y": 0.5259,
      "z": -0.0819,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.134,
        0.04,
        -0.99
      ]
    },
    "BL55": {
      "x": 0.0436,
      "y": 0.2406,
      "z": -0.0574,
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
      "canSoat": "bản Focks phân tích HỎNG (bắn lệch 14.3cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · RẢI DỌC ĐƯỜNG: dời 6.51cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "truocRai": [
        0.0185,
        0.2266,
        -0.0327
      ],
      "raiCm": 6.51,
      "n": [
        -0.072,
        0.227,
        -0.971
      ]
    },
    "BL56": {
      "x": 0.0318,
      "y": 0.1875,
      "z": -0.0603,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.261,
        -0.049,
        -0.964
      ]
    },
    "BL57": {
      "x": 0.0389,
      "y": 0.1519,
      "z": -0.049,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.141,
        -0.177,
        -0.974
      ]
    },
    "BL58": {
      "x": 0.0532,
      "y": 0.1376,
      "z": -0.049,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.038,
        -0.214,
        -0.976
      ]
    },
    "BL59": {
      "x": 0.0398,
      "y": 0.0809,
      "z": -0.042,
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
      "raiCm": 2.78,
      "n": [
        0.361,
        0.011,
        -0.932
      ]
    },
    "BL60": {
      "x": 0.0515,
      "y": 0.0286,
      "z": -0.0383,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.672,
        0.212,
        -0.71
      ]
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
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.6cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai.",
      "n": [
        0.785,
        0.197,
        -0.588
      ]
    },
    "BL62": {
      "x": 0.0695,
      "y": 0.0244,
      "z": -0.0244,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.839,
        0.238,
        -0.489
      ]
    },
    "BL63": {
      "x": 0.0744,
      "y": 0.0192,
      "z": -0.0195,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.862,
        0.276,
        -0.425
      ]
    },
    "BL64": {
      "x": 0.0828,
      "y": 0.0147,
      "z": -0.0005,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.901,
        0.224,
        -0.372
      ]
    },
    "BL65": {
      "x": 0.0996,
      "y": 0.0089,
      "z": 0.0267,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.941,
        -0.002,
        -0.338
      ]
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
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 0.5cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai.",
      "n": [
        0.788,
        -0.508,
        -0.348
      ]
    },
    "BL67": {
      "x": 0.0977,
      "y": 0.0035,
      "z": 0.0443,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.009,
        -0.973,
        -0.232
      ]
    },
    "KI1": {
      "x": 0.0559,
      "y": 0.0046,
      "z": 0.0242,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.031,
        -0.994,
        -0.103
      ]
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
      "raiCm": 1.82,
      "n": [
        -0.842,
        -0.523,
        0.134
      ]
    },
    "KI3": {
      "x": 0.0215,
      "y": 0.0467,
      "z": -0.0197,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.987,
        -0.029,
        0.157
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 5.38cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.984,
        -0.068,
        0.164
      ]
    },
    "KI5": {
      "x": 0.0202,
      "y": 0.0391,
      "z": -0.0223,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.985,
        -0.07,
        0.159
      ]
    },
    "KI6": {
      "x": 0.0254,
      "y": 0.0255,
      "z": -0.0112,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.974,
        -0.147,
        0.173
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.19cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.999,
        0.024,
        0.04
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 4.48cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.999,
        0.023,
        0.036
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 7.95cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.89,
        -0.105,
        -0.443
      ]
    },
    "KI10": {
      "x": 0.029,
      "y": 0.2727,
      "z": -0.0486,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.357,
        0.002,
        -0.934
      ]
    },
    "KI11": {
      "x": 0.0056,
      "y": 0.5089,
      "z": 0.0426,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.129,
        -0.269,
        0.954
      ]
    },
    "KI12": {
      "x": 0.0056,
      "y": 0.5298,
      "z": 0.0515,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.102,
        -0.233,
        0.967
      ]
    },
    "KI13": {
      "x": 0.0056,
      "y": 0.5508,
      "z": 0.0565,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.051,
        -0.175,
        0.983
      ]
    },
    "KI14": {
      "x": 0.0056,
      "y": 0.5717,
      "z": 0.0592,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.036,
        -0.159,
        0.987
      ]
    },
    "KI15": {
      "x": 0.0056,
      "y": 0.5927,
      "z": 0.0597,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.022,
        -0.144,
        0.989
      ]
    },
    "KI16": {
      "x": 0.0056,
      "y": 0.6136,
      "z": 0.0618,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.007,
        -0.128,
        0.992
      ]
    },
    "KI17": {
      "x": 0.0056,
      "y": 0.6431,
      "z": 0.0653,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.014,
        -0.105,
        0.994
      ]
    },
    "KI18": {
      "x": 0.0056,
      "y": 0.6578,
      "z": 0.0675,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.024,
        -0.094,
        0.995
      ]
    },
    "KI19": {
      "x": 0.0056,
      "y": 0.6725,
      "z": 0.0686,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.051,
        -0.063,
        0.997
      ]
    },
    "KI20": {
      "x": 0.0056,
      "y": 0.6873,
      "z": 0.0685,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.079,
        -0.033,
        0.996
      ]
    },
    "KI21": {
      "x": 0.0056,
      "y": 0.702,
      "z": 0.069,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.106,
        -0.002,
        0.994
      ]
    },
    "KI22": {
      "x": 0.0222,
      "y": 0.7231,
      "z": 0.0693,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.106,
        0.019,
        0.994
      ]
    },
    "KI23": {
      "x": 0.0222,
      "y": 0.7458,
      "z": 0.0726,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.097,
        0.127,
        0.987
      ]
    },
    "KI24": {
      "x": 0.0222,
      "y": 0.7648,
      "z": 0.0701,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.079,
        0.296,
        0.952
      ]
    },
    "KI25": {
      "x": 0.0222,
      "y": 0.7821,
      "z": 0.0601,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.057,
        0.447,
        0.893
      ]
    },
    "KI26": {
      "x": 0.0222,
      "y": 0.8033,
      "z": 0.0405,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.035,
        0.544,
        0.838
      ]
    },
    "KI27": {
      "x": 0.0222,
      "y": 0.8063,
      "z": 0.0405,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.016,
        0.605,
        0.796
      ]
    },
    "PC1": {
      "x": 0.0556,
      "y": 0.7481,
      "z": 0.0689,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.251,
        0.3,
        0.92
      ]
    },
    "PC2": {
      "x": 0.1053,
      "y": 0.7347,
      "z": 0.0058,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.129,
        -0.113,
        0.985
      ]
    },
    "PC3": {
      "x": 0.1196,
      "y": 0.6518,
      "z": 0.0025,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.135,
        0.034,
        0.99
      ]
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
      "raiCm": 4.39,
      "n": [
        -0.403,
        0.096,
        0.91
      ]
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
      "raiCm": 3.53,
      "n": [
        -0.301,
        0.186,
        0.935
      ]
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
      "canSoat": "RẢI DỌC ĐƯỜNG: dời 3.12cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt",
      "n": [
        -0.249,
        0.23,
        0.941
      ]
    },
    "PC7": {
      "x": 0.154,
      "y": 0.5146,
      "z": 0.0247,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.014,
        0.471,
        0.882
      ]
    },
    "PC8": {
      "x": 0.1601,
      "y": 0.4698,
      "z": 0.0339,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.086,
        -0.31,
        0.947
      ]
    },
    "PC9": {
      "x": 0.1629,
      "y": 0.4255,
      "z": 0.0543,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.095,
        -0.883,
        -0.459
      ]
    },
    "TE1": {
      "x": 0.1412,
      "y": 0.4359,
      "z": 0.0491,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.766,
        0.562,
        0.31
      ]
    },
    "TE2": {
      "x": 0.1394,
      "y": 0.4679,
      "z": 0.0136,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.753,
        -0.092,
        -0.651
      ]
    },
    "TE3": {
      "x": 0.1406,
      "y": 0.4752,
      "z": 0.0119,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.686,
        -0.161,
        -0.709
      ]
    },
    "TE4": {
      "x": 0.143,
      "y": 0.5124,
      "z": -0.0022,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.172,
        -0.491,
        -0.854
      ]
    },
    "TE5": {
      "x": 0.143,
      "y": 0.5304,
      "z": -0.0122,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.058,
        -0.414,
        -0.908
      ]
    },
    "TE6": {
      "x": 0.141,
      "y": 0.5416,
      "z": -0.0146,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.002,
        -0.37,
        -0.929
      ]
    },
    "TE7": {
      "x": 0.1358,
      "y": 0.5408,
      "z": -0.0143,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.014,
        -0.356,
        -0.934
      ]
    },
    "TE8": {
      "x": 0.1403,
      "y": 0.5525,
      "z": -0.02,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.033,
        -0.34,
        -0.94
      ]
    },
    "TE9": {
      "x": 0.138,
      "y": 0.5857,
      "z": -0.0332,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.056,
        -0.313,
        -0.948
      ]
    },
    "TE10": {
      "x": 0.1224,
      "y": 0.6645,
      "z": -0.0497,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.158,
        -0.13,
        -0.979
      ]
    },
    "TE11": {
      "x": 0.1251,
      "y": 0.676,
      "z": -0.0493,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.386,
        -0.055,
        -0.921
      ]
    },
    "TE12": {
      "x": 0.1281,
      "y": 0.7264,
      "z": -0.0488,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.55,
        0.055,
        -0.833
      ]
    },
    "TE13": {
      "x": 0.1256,
      "y": 0.7775,
      "z": -0.0466,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.632,
        0.241,
        -0.736
      ]
    },
    "TE14": {
      "x": 0.1153,
      "y": 0.8146,
      "z": -0.0435,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.627,
        0.494,
        -0.602
      ]
    },
    "TE15": {
      "x": 0.0762,
      "y": 0.8386,
      "z": -0.0212,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.838,
        0.351,
        -0.417
      ]
    },
    "TE16": {
      "x": 0.0283,
      "y": 0.888,
      "z": -0.0194,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.934,
        -0.082,
        -0.347
      ]
    },
    "TE17": {
      "x": 0.0346,
      "y": 0.9098,
      "z": -0.0063,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.968,
        -0.18,
        -0.173
      ]
    },
    "TE18": {
      "x": 0.039,
      "y": 0.9183,
      "z": -0.0198,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.976,
        -0.217,
        -0.031
      ]
    },
    "TE19": {
      "x": 0.0448,
      "y": 0.9357,
      "z": -0.0208,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.98,
        -0.194,
        0.05
      ]
    },
    "TE20": {
      "x": 0.0413,
      "y": 0.9442,
      "z": -0.0119,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.986,
        -0.152,
        0.073
      ]
    },
    "TE21": {
      "x": 0.039,
      "y": 0.9239,
      "z": -0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.987,
        -0.119,
        0.108
      ]
    },
    "TE22": {
      "x": 0.0401,
      "y": 0.9279,
      "z": -0.0002,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.96,
        -0.097,
        0.262
      ]
    },
    "TE23": {
      "x": 0.0308,
      "y": 0.9423,
      "z": 0.0347,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.844,
        -0.077,
        0.53
      ]
    },
    "GB1": {
      "x": 0.0311,
      "y": 0.9304,
      "z": 0.0311,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.816,
        -0.12,
        0.566
      ]
    },
    "GB2": {
      "x": 0.0375,
      "y": 0.9156,
      "z": -0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.933,
        -0.08,
        0.352
      ]
    },
    "GB3": {
      "x": 0.0376,
      "y": 0.9242,
      "z": 0.0171,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.965,
        0.012,
        0.263
      ]
    },
    "GB4": {
      "x": 0.0387,
      "y": 0.9633,
      "z": 0.0098,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.969,
        0.032,
        0.245
      ]
    },
    "GB5": {
      "x": 0.0402,
      "y": 0.9614,
      "z": 0.005,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.971,
        0.031,
        0.235
      ]
    },
    "GB6": {
      "x": 0.0417,
      "y": 0.9596,
      "z": 0.0002,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.974,
        0.031,
        0.225
      ]
    },
    "GB7": {
      "x": 0.0432,
      "y": 0.9578,
      "z": -0.0046,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.976,
        0.03,
        0.215
      ]
    },
    "GB8": {
      "x": 0.0419,
      "y": 0.9587,
      "z": -0.0116,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.988,
        -0.015,
        0.152
      ]
    },
    "GB9": {
      "x": 0.0399,
      "y": 0.9587,
      "z": -0.0163,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.993,
        -0.047,
        0.107
      ]
    },
    "GB10": {
      "x": 0.0374,
      "y": 0.9231,
      "z": -0.0137,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.994,
        -0.103,
        0.037
      ]
    },
    "GB11": {
      "x": 0.0361,
      "y": 0.9145,
      "z": -0.012,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.993,
        -0.117,
        0.02
      ]
    },
    "GB12": {
      "x": 0.0335,
      "y": 0.9035,
      "z": -0.017,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.985,
        -0.166,
        -0.041
      ]
    },
    "GB13": {
      "x": 0.0231,
      "y": 0.9774,
      "z": 0.0296,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.682,
        0.399,
        0.613
      ]
    },
    "GB14": {
      "x": 0.0165,
      "y": 0.9648,
      "z": 0.0402,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.559,
        0.56,
        0.611
      ]
    },
    "GB15": {
      "x": 0.0178,
      "y": 0.9829,
      "z": 0.0284,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.52,
        0.699,
        0.49
      ]
    },
    "GB16": {
      "x": 0.0178,
      "y": 0.9861,
      "z": 0.0244,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.509,
        0.728,
        0.46
      ]
    },
    "GB17": {
      "x": 0.0178,
      "y": 0.9915,
      "z": 0.0102,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.507,
        0.798,
        0.325
      ]
    },
    "GB18": {
      "x": 0.0189,
      "y": 0.9952,
      "z": -0.0036,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.494,
        0.848,
        0.191
      ]
    },
    "GB19": {
      "x": 0.0149,
      "y": 0.9424,
      "z": -0.0713,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.247,
        -0.101,
        -0.964
      ]
    },
    "GB20": {
      "x": 0.0288,
      "y": 0.9126,
      "z": -0.0423,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.744,
        -0.431,
        -0.511
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
      "anchor": true,
      "n": [
        0.367,
        0.683,
        0.632
      ]
    },
    "GB22": {
      "x": 0.0966,
      "y": 0.7427,
      "z": 0.0055,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.582,
        -0.179,
        0.794
      ]
    },
    "GB23": {
      "x": 0.0926,
      "y": 0.7231,
      "z": 0.0091,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.754,
        -0.139,
        0.642
      ]
    },
    "GB24": {
      "x": 0.0443,
      "y": 0.6842,
      "z": 0.0673,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.564,
        -0.173,
        0.807
      ]
    },
    "GB25": {
      "x": 0.0649,
      "y": 0.6338,
      "z": -0.0307,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.984,
        -0.078,
        -0.158
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
      "anchor": true,
      "n": [
        0.985,
        -0.028,
        0.168
      ]
    },
    "GB27": {
      "x": 0.0734,
      "y": 0.5508,
      "z": 0.0387,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.792,
        -0.041,
        0.609
      ]
    },
    "GB28": {
      "x": 0.0734,
      "y": 0.5452,
      "z": 0.0387,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.453,
        -0.096,
        0.886
      ]
    },
    "GB29": {
      "x": 0.0953,
      "y": 0.5287,
      "z": -0.0019,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.943,
        0.001,
        0.334
      ]
    },
    "GB30": {
      "x": 0.0939,
      "y": 0.4948,
      "z": -0.0139,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.959,
        0.081,
        -0.273
      ]
    },
    "GB31": {
      "x": 0.0884,
      "y": 0.3551,
      "z": 0.0029,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.903,
        -0.196,
        0.383
      ]
    },
    "GB32": {
      "x": 0.082,
      "y": 0.3298,
      "z": 0.0023,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.896,
        -0.213,
        0.391
      ]
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
      "raiCm": 1.5,
      "n": [
        0.89,
        -0.225,
        0.396
      ]
    },
    "GB34": {
      "x": 0.0702,
      "y": 0.2499,
      "z": -0.0007,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.829,
        -0.002,
        0.56
      ]
    },
    "GB35": {
      "x": 0.0704,
      "y": 0.1352,
      "z": -0.0268,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.973,
        -0.172,
        0.157
      ]
    },
    "GB36": {
      "x": 0.0716,
      "y": 0.1389,
      "z": -0.0192,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.994,
        -0.106,
        0.032
      ]
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
      "raiCm": 2.23,
      "n": [
        0.999,
        0.002,
        -0.044
      ]
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
      "raiCm": 1.63,
      "n": [
        0.994,
        0.064,
        -0.087
      ]
    },
    "GB39": {
      "x": 0.0634,
      "y": 0.0815,
      "z": -0.0204,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.981,
        0.135,
        -0.136
      ]
    },
    "GB40": {
      "x": 0.0728,
      "y": 0.0212,
      "z": -0.0073,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.768,
        0.512,
        -0.385
      ]
    },
    "GB41": {
      "x": 0.0664,
      "y": 0.0464,
      "z": 0.0109,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.729,
        0.677,
        -0.097
      ]
    },
    "GB42": {
      "x": 0.0814,
      "y": 0.0277,
      "z": 0.0279,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.663,
        0.74,
        0.111
      ]
    },
    "GB43": {
      "x": 0.0818,
      "y": 0.0235,
      "z": 0.0381,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.644,
        0.73,
        0.229
      ]
    },
    "GB44": {
      "x": 0.0966,
      "y": 0.0063,
      "z": 0.0589,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.672,
        0.674,
        0.307
      ]
    },
    "LR1": {
      "x": 0.0692,
      "y": 0.0029,
      "z": 0.0727,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.014,
        -0.998,
        -0.069
      ]
    },
    "LR2": {
      "x": 0.06,
      "y": 0.0247,
      "z": 0.0562,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.033,
        0.346,
        0.938
      ]
    },
    "LR3": {
      "x": 0.0519,
      "y": 0.0463,
      "z": 0.0247,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.303,
        0.621,
        0.723
      ]
    },
    "LR4": {
      "x": 0.0329,
      "y": 0.0515,
      "z": 0.0016,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.737,
        0.351,
        0.578
      ]
    },
    "LR5": {
      "x": 0.029,
      "y": 0.1297,
      "z": -0.0073,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.811,
        0.035,
        0.584
      ]
    },
    "LR6": {
      "x": 0.0206,
      "y": 0.1671,
      "z": -0.0093,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.873,
        -0.001,
        0.488
      ]
    },
    "LR7": {
      "x": 0.0169,
      "y": 0.2471,
      "z": -0.0268,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.996,
        -0.064,
        -0.056
      ]
    },
    "LR8": {
      "x": 0.0119,
      "y": 0.2712,
      "z": -0.014,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.979,
        -0.198,
        0.047
      ]
    },
    "LR9": {
      "x": 0.0143,
      "y": 0.3298,
      "z": 0.0025,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.965,
        -0.115,
        0.237
      ]
    },
    "LR10": {
      "x": 0.0282,
      "y": 0.4705,
      "z": 0.0357,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.514,
        -0.044,
        0.857
      ]
    },
    "LR11": {
      "x": 0.0295,
      "y": 0.4833,
      "z": 0.0377,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.49,
        -0.043,
        0.871
      ]
    },
    "LR12": {
      "x": 0.0287,
      "y": 0.4961,
      "z": 0.0371,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.301,
        -0.034,
        0.953
      ]
    },
    "LR13": {
      "x": 0.0764,
      "y": 0.6289,
      "z": -0.0076,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.99,
        -0.046,
        0.134
      ]
    },
    "LR14": {
      "x": 0.0438,
      "y": 0.7026,
      "z": 0.068,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.229,
        0.002,
        0.973
      ]
    },
    "CV1": {
      "x": -0.0016,
      "y": 0.492,
      "z": 0.0076,
      "q": "approx",
      "snap": true,
      "src": "who",
      "conf": "WHO-lấp",
      "snapDir": "front",
      "n": [
        -0.014,
        0.655,
        -0.756
      ]
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
      "snapDir": "front",
      "n": [
        0.065,
        0.376,
        0.924
      ]
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
      "snapDir": "front",
      "n": [
        0.039,
        -0.036,
        0.999
      ]
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
      "snapDir": "front",
      "n": [
        0.029,
        -0.058,
        0.998
      ]
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
      "snapDir": "front",
      "n": [
        0.019,
        -0.079,
        0.997
      ]
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
      "snapDir": "front",
      "n": [
        0.014,
        -0.09,
        0.996
      ]
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
      "snapDir": "front",
      "n": [
        -0.008,
        -0.124,
        0.992
      ]
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
      "snapDir": "front",
      "n": [
        -0.027,
        -0.256,
        0.966
      ]
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
      "snapDir": "front",
      "n": [
        -0.025,
        -0.183,
        0.983
      ]
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
      "snapDir": "front",
      "n": [
        -0.024,
        -0.109,
        0.994
      ]
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
      "snapDir": "front",
      "n": [
        -0.022,
        -0.035,
        0.999
      ]
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
      "snapDir": "front",
      "n": [
        -0.023,
        0.023,
        0.999
      ]
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
      "snapDir": "front",
      "n": [
        -0.024,
        0.082,
        0.996
      ]
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
      "snapDir": "front",
      "n": [
        -0.025,
        0.14,
        0.99
      ]
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
      "snapDir": "front",
      "n": [
        -0.026,
        0.198,
        0.98
      ]
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
      "snapDir": "front",
      "n": [
        -0.041,
        0.163,
        0.986
      ]
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
      "canSoat": "TẦNG DA: phép chiếu đòi bẻ NGANG 1.8cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai.",
      "n": [
        -0.031,
        0.254,
        0.967
      ]
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
      "snapDir": "front",
      "n": [
        -0.021,
        0.316,
        0.949
      ]
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
      "snapDir": "front",
      "n": [
        -0.012,
        0.374,
        0.927
      ]
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
      "snapDir": "front",
      "n": [
        -0.001,
        0.439,
        0.898
      ]
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
      "snapDir": "front",
      "n": [
        0.017,
        0.597,
        0.802
      ]
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
      "snapDir": "front",
      "n": [
        0.011,
        0.695,
        0.719
      ]
    },
    "CV23": {
      "x": 0,
      "y": 0.8677,
      "z": 0.0291,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "snapDir": "front",
      "n": [
        0.032,
        0.056,
        0.998
      ]
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
      "snapDir": "front",
      "n": [
        0.027,
        -0.121,
        0.992
      ]
    },
    "GV1": {
      "x": 0,
      "y": 0.4933,
      "z": -0.0647,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.013,
        -0.71,
        -0.704
      ]
    },
    "GV2": {
      "x": 0,
      "y": 0.5066,
      "z": -0.0734,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.012,
        -0.386,
        -0.922
      ]
    },
    "GV3": {
      "x": 0,
      "y": 0.5931,
      "z": -0.0582,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.004,
        0.132,
        -0.991
      ]
    },
    "GV4": {
      "x": 0,
      "y": 0.619,
      "z": -0.0559,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.042,
        0.069,
        -0.997
      ]
    },
    "GV5": {
      "x": 0,
      "y": 0.6351,
      "z": -0.0576,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.058,
        0.039,
        -0.998
      ]
    },
    "GV6": {
      "x": 0,
      "y": 0.6703,
      "z": -0.0587,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.094,
        -0.028,
        -0.995
      ]
    },
    "GV7": {
      "x": 0,
      "y": 0.683,
      "z": -0.0591,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.056,
        -0.086,
        -0.995
      ]
    },
    "GV8": {
      "x": 0,
      "y": 0.6969,
      "z": -0.0619,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.051,
        -0.091,
        -0.995
      ]
    },
    "GV9": {
      "x": 0,
      "y": 0.7288,
      "z": -0.0694,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.04,
        -0.103,
        -0.994
      ]
    },
    "GV10": {
      "x": 0.0017,
      "y": 0.7435,
      "z": -0.0695,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.027,
        -0.038,
        -0.999
      ]
    },
    "GV11": {
      "x": 0,
      "y": 0.7596,
      "z": -0.073,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.001,
        0.135,
        -0.991
      ]
    },
    "GV12": {
      "x": 0,
      "y": 0.7985,
      "z": -0.069,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.017,
        0.263,
        -0.965
      ]
    },
    "GV13": {
      "x": 0,
      "y": 0.825,
      "z": -0.0684,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.028,
        0.347,
        -0.938
      ]
    },
    "GV14": {
      "x": 0,
      "y": 0.8363,
      "z": -0.0667,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.033,
        0.382,
        -0.924
      ]
    },
    "GV15": {
      "x": 0,
      "y": 0.9061,
      "z": -0.0544,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.016,
        -0.402,
        -0.916
      ]
    },
    "GV16": {
      "x": 0,
      "y": 0.9145,
      "z": -0.0601,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.039,
        -0.528,
        -0.848
      ]
    },
    "GV17": {
      "x": 0,
      "y": 0.9424,
      "z": -0.072,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.017,
        -0.037,
        -0.999
      ]
    },
    "GV18": {
      "x": 0,
      "y": 0.9739,
      "z": -0.0641,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.004,
        0.487,
        -0.873
      ]
    },
    "GV19": {
      "x": 0,
      "y": 0.994,
      "z": -0.0433,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.006,
        0.854,
        -0.52
      ]
    },
    "GV20": {
      "x": 0,
      "y": 1,
      "z": -0.0149,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.01,
        0.993,
        -0.12
      ]
    },
    "GV21": {
      "x": 0,
      "y": 0.9993,
      "z": 0.0028,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.009,
        0.975,
        0.222
      ]
    },
    "GV22": {
      "x": 0,
      "y": 0.9937,
      "z": 0.0179,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.003,
        0.925,
        0.38
      ]
    },
    "GV23": {
      "x": 0,
      "y": 0.9892,
      "z": 0.0279,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.001,
        0.877,
        0.481
      ]
    },
    "GV24": {
      "x": 0,
      "y": 0.9863,
      "z": 0.0292,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        -0.017,
        0.751,
        0.66
      ]
    },
    "GV25": {
      "x": 0,
      "y": 0.9109,
      "z": 0.0611,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.071,
        -0.147,
        0.987
      ]
    },
    "GV26": {
      "x": 0,
      "y": 0.9036,
      "z": 0.0526,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.057,
        -0.257,
        0.965
      ]
    },
    "GV27": {
      "x": 0,
      "y": 0.9003,
      "z": 0.0515,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.053,
        -0.288,
        0.956
      ]
    },
    "GV28": {
      "x": 0,
      "y": 0.9026,
      "z": 0.0468,
      "q": "exact",
      "snap": true,
      "src": "anchor",
      "conf": "mốc",
      "anchor": true,
      "n": [
        0.049,
        -0.379,
        0.924
      ]
    }
  }
};
