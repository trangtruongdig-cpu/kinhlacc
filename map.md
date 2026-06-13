A7 = MAX toàn bộ số đo Chi trên (C10..C15 và F10..F15, gồm cả trái + phải)
A8 = MIN toàn bộ số đo Chi trên (C10..C15 và F10..F15, gồm cả trái + phải)
B7 = A7 - A8
D7 = (A7+A8)/2
E7 = B7/6
F7 = D7 + E7
F8 = D7 - E7
C10 = Tiểu trái
C11 = Tâm trái
C12 = Tam trái
C13 = Bào phải
C14 = Đại trái
C15 = Phế trái

F10 = Tiểu phải
F11 = Tâm phải
F12 = Tam phải
F13 = Bào phải
F14 = Đại phải
F15 = Phế phải

D10=(C10+F10)/2
D11=(C11+F11)/2
D12=(C12+F12)/2
D13=(C13+F13)/2
D14=(C14+F14)/2
D15=(C15+F15)/2

E10=D10-D7
E11=D11-D7
E12=D12-D7
E13=D13-D7
E14=D14-D7
E15=D15-D7

H10=ABS(C10-F10)
H11=ABS(C11-F11)
H12=ABS(C12-F12)
H13=ABS(C13-F13)
H14=ABS(C14-F14)
H15=ABS(C15-F15)

A18 = MAX toàn bộ số đo Chi dưới (C21..C26 và F21..F26, gồm cả trái + phải)
A19 = MIN toàn bộ số đo Chi dưới (C21..C26 và F21..F26, gồm cả trái + phải)
B18=A18-A19
D18=(A18+A19)/2
E18=B18/6
F18=D18+E18
F19=D18-E18

C21 = Bàng trái
C22 = Thận trái
C23 = Đảm trái
C24 = Vị trái
C25 = Can trái
C26 = Tỳ trái

F21 = Bàng phải
F22 = Thận phải
F23 = Đảm phải
F24 = Vị phải
F25 = Can phải
F26 = Tỳ phải

D21=(C21+F21)/2
D22=(C22+F22)/2
D23=(C23+F23)/2
D24=(C24+F24)/2
D25=(C25+F25)/2
D26=(C26+F26)/2


H21=ABS(C21-F21)
H22=ABS(C22-F22)
H23=ABS(C23-F23)
H24=ABS(C24-F24)
H25=ABS(C25-F25)
H26=ABS(C26-F26)

E21=D21-D18
E22=D22-D18
E23=D23-D18
E24=D24-D18
E25=D25-D18
E26=D26-D18


H28=D7-D18