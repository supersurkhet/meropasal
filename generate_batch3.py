import json

anjal = "org_01KMQ64R6WHY61G0ZNY43SWN91"
ishwor = "org_01KMQ64JBVZFTKQYGTHE1PX7R8"

entries = []

def add_entry(org, img, name, code, unit, rows):
    entries.append({
        "orgId": org,
        "imageFile": img,
        "productName": name,
        "productCode": code,
        "unit": unit,
        "rows": rows
    })

def row(date, part, rq=None, rr=None, ra=None, iq=None, bq=None, unit=None, unclear=False):
    return {
        "date": date,
        "particulars": part,
        "receiptQty": rq,
        "receiptRate": rr,
        "receiptAmount": ra,
        "issuedQty": iq,
        "balanceQty": bq,
        "unit": unit,
        "unclear": unclear
    }

# ===== IMAGE 1 (anjal) =====
img = "IMG_20260526_152100.jpg"
add_entry(anjal, img, "SOFTLOVE PANTS DIAPER XXL18", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=425.60, bq=10, unit="pkt")
])
add_entry(anjal, img, "SOFTLOVE PANTS DIAPER L22", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=425.60, bq=10, unit="pkt")
])
add_entry(anjal, img, "SOFTLOVE PANTS DIAPER (XL20)", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=425.60, bq=10, unit="pkt")
])
add_entry(anjal, img, "SOFTLOVE PANTS DIAPER (M24)", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=425.60, bq=10, unit="pkt")
])

# ===== IMAGE 2 (anjal) =====
img = "IMG_20260526_152102.jpg"
add_entry(anjal, img, "HOKEE CANNED SWEET CORN 400gm", "2005", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=201.37, bq=18, unit="pkt"),
    row("082-04-05", "Sales bill no. 069", iq=6, bq=12, unit="pkt"),
    row("082-06-24", "Sales bill no. 212", iq=2, unit="p", unclear=True),
])
add_entry(anjal, img, "ROZA TUNA CHUNK IN BRINE 185gm", "1604", "can", [
    row("082-04-01", "श्रीकृष्ण", ra=146.49, bq=3, unit="pcs"),
    row("082-04-08", "purchase bill T-0010", rq=96, bq=99, unit="can"),
    row("082-04-10", "Sales bill no. 178", iq=12, bq=87, unit="can"),
    row("082-04-10", "Sales bill no. 184", iq=12, bq=75, unit="can"),
    row("082-04-10", "Sales bill no. 188", iq=6, bq=69, unit="can"),
    row("082-04-10", "Sales bill no. 212", iq=12, bq=57, unit="can"),
    row("082-07-15", "Sales bill no. 257", iq=12, unit="pcs"),
    row("9/14", "S.B 440", iq=4, unit="pcs"),
    row("9/20", "Sales return", rq=24, unit="pcs"),
])
add_entry(anjal, img, "SUPER DEIUX PANTY LINER", "1806", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=62.40, bq=48, unit="pkt")
])
add_entry(anjal, img, "ROZA TUNA CHUNK IN VEGETABLE OIL 185gm", "1604", "pcs", [
    row("082-04-01", "श्रीकृष्ण", ra=153.74, bq=6, unit="pcs"),
    row("082-04-08", "purchase bill T-0010", rq=96, bq=102, unit="pcs"),
    row("082-04-10", "Sales bill no. 178", iq=24, bq=78, unit="pcs"),
    row("082-04-10", "Sales bill no. 184", iq=12, bq=66, unit="pcs"),
    row("082-04-10", "Sales bill no. 189", iq=6, bq=60, unit="pcs"),
    row("082-04-10", "Sales bill no. 212", iq=12, bq=48, unit="pcs"),
    row("082-07-15", "Sales bill no. 257", iq=12, bq=36, unit="pcs"),
    row("10/15", "S.B 492", iq=24, bq=12, unit="pcs"),
    row("9/20", "Sales return", rq=24, unit="pcs"),
])

# ===== IMAGE 3 (anjal) =====
img = "IMG_20260526_152104.jpg"
add_entry(anjal, img, "SIAM ELEPHANT CANNED COCONUT MILK 400ml", "2106", "ctn", [
    row("082-04-01", "श्रीकृष्ण", bq=6, unit="ctn"),
    row("12/23", "641", iq=6, bq=0, unit="ctn"),
])
add_entry(anjal, img, "SHOON FATT VEGGIE CRACKERS BISCUIT 360gms", "1905", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=253.42, bq=6, unit="pkt"),
    row("082-04-05", "purchase bill 010", rq=60, ra=217.23, bq=66, unit="pkt"),
    row("082-04-10", "Sales bill 58", iq=24, bq=42, unit="p"),
    row("082-04-20", "Sales bill 069", iq=12, bq=30, unit="p"),
    row("082-04-20", "11 - 096", iq=12, bq=18, unit="p"),
])
add_entry(anjal, img, "SIAM ELEPHANT CANNED COCONUT CREAM 400ml", "2106", "ctn", [
    row("082-04-01", "श्रीकृष्ण", ra=188.00, bq=6, unit="ctn"),
    row("12/23", "641", iq=6, bq=0, unit="ctn"),
])
add_entry(anjal, img, "SHOON FATT GOLD CRACKERS BISCUIT 350gms", "1905", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=262.82, bq=6, unit="pkt"),
    row("082-04-05", "purchase bill 010", rq=60, bq=66, unit="pkt"),
    row("082-04-14", "Sales bill 041", iq=12, bq=54, unit="p"),
    row("082-04-20", "11 - 058", iq=24, bq=30, unit="p"),
    row("082-04-20", "11 - 069", iq=12, bq=18, unit="p"),
])

# ===== IMAGE 4 (anjal) =====
img = "IMG_20260526_152106.jpg"
add_entry(anjal, img, "ADFIT ADULT PANT DIAPER (L10)", "9619", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=592.11, bq=60, unit="pkt")
])
add_entry(anjal, img, "SIAM ELEPHANT INSTANT SOUR SOUP PASTE TOMYAM 454gm", "2103", "pcs", [
    row("082-04-01", "श्रीकृष्ण", ra=512.43, bq=12, unit="pcs"),
    row("12/23", "641", bq=12, unit="pcs"),
])
add_entry(anjal, img, "ADFIT ADULT PANT DIAPER (M10)", "9619", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=569.71, bq=60, unit="pkt"),
    row("12/23", "641", bq=50, unit="pkt"),
])
add_entry(anjal, img, "JAGUN DELUX BATHROOM TISSUE PAPER 3 PLY", "", "pcs", [
    row("082-11-24", "Purchase bill no. 296 -2000/- 41.81", bq=2000, unit="pcs", unclear=True)
])

# ===== IMAGE 5 (anjal) =====
img = "IMG_20260526_152108.jpg"
add_entry(anjal, img, "FENA 400GM DETERGENT", "3402", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=42.16, bq=960, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=60, bq=900, unit="pkt"),
    row("082-04-05", "11 - 013", iq=120, bq=780, unit="p"),
    row("082-04-09", "11 - 030", iq=60, bq=720, unit="p"),
    row("082-05-27", "Sales bill no. 154", iq=300, bq=420, unit="p"),
    row("082-11-14", "11 - 552", iq=120, bq=300, unit="p"),
    row("082-12-02", "11 - 594", iq=72, bq=228, unit="p"),
])
add_entry(anjal, img, "FENA 4KG DETERGENT", "3402", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=577.44, bq=30, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=5, bq=25, unit="p"),
    row("082-04-05", "11 - 013", iq=10, bq=15, unit="p"),
    row("082-04-09", "11 - 030", iq=5, bq=10, unit="p"),
])
add_entry(anjal, img, "FENA 900GM DETERGENT", "3402", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=87.84, bq=240, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=30, bq=210, unit="p"),
    row("082-04-05", "11 - 033", iq=60, bq=150, unit="p"),
    row("082-05-27", "Sales bill no. 154", iq=60, bq=90, unit="p"),
])
add_entry(anjal, img, "IMPACT 500GM DETERGENT", "3402", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=293.21, bq=432, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=24, bq=408, unit="p"),
    row("082-04-05", "11 - 013", iq=48, bq=360, unit="p"),
    row("082-04-09", "11 - 030", iq=24, bq=336, unit="p"),
    row("082-05-27", "Sales bill no. 154", iq=96, bq=240, unit="p"),
    row("082-04-10", "Sales bill no. 184", iq=24, bq=216, unit="p"),
    row("082-04-10", "Sales bill no. 189", iq=48, bq=168, unit="p"),
    row("082-04-10", "Sales bill no. 212", iq=60, bq=108, unit="p"),
    row("082-11-14", "11 - 552", iq=24, bq=84, unit="p"),
    row("082-12-02", "11 - 594", iq=24, bq=60, unit="p"),
])

# ===== IMAGE 6 (anjal) =====
img = "IMG_20260526_152110.jpg"
add_entry(anjal, img, "IMPACT 1 KG DETERGENT", "3402", "p", [
    row("082-04-01", "श्रीकृष्ण", ra=187.67, bq=336, unit="p"),
    row("082-04-05", "Sales bill 012", iq=12, bq=324, unit="p"),
    row("082-04-05", "11 - 013", iq=24, bq=300, unit="p"),
    row("082-05-27", "Sales bill no. 154", iq=48, bq=252, unit="p"),
    row("082-04-10", "Sales bill no. 224", iq=12, bq=240, unit="p"),
    row("082-04-10", "Sales bill no. 231", iq=100, bq=140, unit="p"),
    row("083-01-14", "11 - 683", iq=48, bq=92, unit="p"),
])
add_entry(anjal, img, "MDH KASHMIRI MIRCHI 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=166.57, bq=20, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=10, bq=10, unit="pkt"),
])
add_entry(anjal, img, "IMPACT 3 KG DETERGENT", "3402", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=684.00, bq=80, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=5, bq=75, unit="p"),
    row("082-04-05", "11 - 013", iq=10, bq=65, unit="p"),
    row("082-04-09", "11 - 030", iq=5, bq=60, unit="p"),
    row("082-05-27", "Sales bill no. 154", iq=10, bq=50, unit="p"),
    row("082-04-10", "Sales bill no. 231", iq=10, bq=40, unit="p"),
    row("083-01-14", "11 - 683", iq=12, bq=28, unit="p"),
])
add_entry(anjal, img, "MDH CHICKEN CURRY MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=218.21, bq=67, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=20, bq=47, unit="pkt"),
    row("082-04-10", "Sales bill no. 184", iq=20, bq=27, unit="pkt"),
])

# ===== IMAGE 7 (anjal) =====
img = "IMG_20260526_152111.jpg"
add_entry(anjal, img, "MDH CHICKEN CURRY MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=124.55, bq=30, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=20, bq=10, unit="pkt"),
])
add_entry(anjal, img, "MDH HYD BIRYANI MASALA 50gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=120.63, bq=30, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=20, bq=10, unit="pkt"),
])
add_entry(anjal, img, "MDH KITCHEN KING 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=125.87, bq=1, unit="pkt")
])
add_entry(anjal, img, "MDH SABZI MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=104.89, bq=8, unit="pkt")
])

# ===== IMAGE 8 (ishwor) =====
img = "IMG_20260526_152114.jpg"
add_entry(ishwor, img, "MDH GARAM MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=136.37, bq=93, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=15, bq=78, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI BHUJIA 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=253.24, bq=42, unit="pkt"),
    row("082-04-10", "Sales bill no. 192", iq=42, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI BHUJIA 900gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=384.84, bq=21, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=21, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI BHUJIA 175gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=82.46, bq=50, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=50, bq=0, unit="pkt"),
])

# ===== IMAGE 9 (anjal) =====
img = "IMG_20260526_152116.jpg"
add_entry(anjal, img, "BIKAGI PAPAD 300gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=164.93, bq=32, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=32, bq=0, unit="pkt"),
])
add_entry(anjal, img, "BIKAGI TANABANA 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=153.94, bq=22, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=22, bq=0, unit="pkt"),
])
add_entry(anjal, img, "BIKAGI KUCH-KUCH 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=153.94, bq=22, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=22, bq=0, unit="pkt"),
])
add_entry(anjal, img, "BIKAGI SOAN PAPADI 200gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=120.95, bq=30, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=30, bq=0, unit="pkt"),
])

# ===== IMAGE 10 (anjal) =====
img = "IMG_20260526_152119.jpg"
add_entry(anjal, img, "BG PANIPURI PAPAD 800gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=240.82, bq=1664, unit="pkt"),
    row("082-04-10", "Sales bill no. 192", iq=100, bq=1564, unit="pkt"),
    row("082-04-10", "Sales bill no. 231", iq=100, bq=1464, unit="pkt"),
    row("082-11-14", "11 - 552", iq=130, bq=1334, unit="pkt"),
    row("082-11-16", "11 - 555", iq=200, bq=1134, unit="pkt"),
])
add_entry(anjal, img, "FENA CAKE 150gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=14.29, bq=832, unit="pkt"),
    row("082-04-10", "Sales bill no. 231", iq=200, bq=632, unit="pkt"),
])
add_entry(anjal, img, "FENA CAKE 300gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=28.57, bq=280, unit="pkt"),
    row("082-04-10", "Sales bill no. 231", iq=100, bq=180, unit="pkt"),
])
add_entry(anjal, img, "BIKAGI MONGDAL 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=153.94, bq=40, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=40, bq=0, unit="pkt"),
])

# ===== IMAGE 11 (anjal) =====
img = "IMG_20260526_152121.jpg"
add_entry(anjal, img, "BIKAGI PEANUT 175gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=82.46, bq=60, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=60, bq=0, unit="pkt"),
])
add_entry(anjal, img, "NIP BAR TUB 500gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=78.55, bq=312, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=24, bq=288, unit="p"),
    row("082-04-05", "11 - 013", iq=24, bq=264, unit="p"),
    row("082-04-10", "11 - 124", iq=24, bq=240, unit="p"),
    row("082-04-20", "11 - 222", iq=24, bq=216, unit="p"),
    row("082-04-30", "11 - 231", iq=96, bq=120, unit="p"),
])
add_entry(anjal, img, "NIP BAR 300gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=94.83, bq=300, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=20, bq=280, unit="p"),
    row("082-04-05", "11 - 013", iq=100, bq=180, unit="p"),
    row("082-04-09", "11 - 029", iq=20, bq=160, unit="p"),
    row("082-04-30", "11 - 231", iq=100, bq=60, unit="p"),
])

# ===== IMAGE 12 (ishwor) =====
img = "IMG_20260526_152123.jpg"
add_entry(ishwor, img, "MDH CHICKEN CURRY MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=124.55, bq=30, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=20, bq=10, unit="pkt"),
])
add_entry(ishwor, img, "MDH HYD BIRYANI MASALA 50gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=120.63, bq=30, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=20, bq=10, unit="pkt"),
])
add_entry(ishwor, img, "MDH KITCHEN KING 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=125.87, bq=1, unit="pkt")
])
add_entry(ishwor, img, "MDH SABZI MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=104.89, bq=8, unit="pkt")
])

# ===== IMAGE 13 (ishwor) =====
img = "IMG_20260526_152125.jpg"
add_entry(ishwor, img, "MDH GARAM MASALA 100gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=136.37, bq=93, unit="pkt"),
    row("082-05-27", "Sales bill no. 154", iq=15, bq=78, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI BHUJIA 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=253.24, bq=42, unit="pkt"),
    row("082-04-10", "Sales bill no. 192", iq=42, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI BHUJIA 900gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=384.84, bq=21, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=21, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI BHUJIA 175gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=82.46, bq=50, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=50, bq=0, unit="pkt"),
])

# ===== IMAGE 14 (ishwor) =====
img = "IMG_20260526_152127.jpg"
add_entry(ishwor, img, "BIKAGI PAPAD 300gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=164.93, bq=32, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=32, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI TANABANA 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=153.94, bq=22, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=22, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI KUCH-KUCH 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=153.94, bq=22, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=22, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI SOAN PAPADI 200gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=120.95, bq=30, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=30, bq=0, unit="pkt"),
])

# ===== IMAGE 15 (ishwor) =====
img = "IMG_20260526_152129.jpg"
add_entry(ishwor, img, "BG PANIPURI PAPAD 800gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=240.82, bq=1664, unit="pkt"),
    row("082-04-10", "Sales bill no. 192", iq=100, bq=1564, unit="pkt"),
    row("082-04-10", "Sales bill no. 231", iq=100, bq=1464, unit="pkt"),
    row("082-11-14", "11 - 552", iq=130, bq=1334, unit="pkt"),
    row("082-11-16", "11 - 555", iq=200, bq=1134, unit="pkt"),
])
add_entry(ishwor, img, "FENA CAKE 150gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=14.29, bq=832, unit="pkt"),
    row("082-04-10", "Sales bill no. 231", iq=200, bq=632, unit="pkt"),
])
add_entry(ishwor, img, "FENA CAKE 300gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=28.57, bq=280, unit="pkt"),
    row("082-04-10", "Sales bill no. 231", iq=100, bq=180, unit="pkt"),
])
add_entry(ishwor, img, "BIKAGI MONGDAL 350gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=153.94, bq=40, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=40, bq=0, unit="pkt"),
])

# ===== IMAGE 16 (ishwor) =====
img = "IMG_20260526_152131.jpg"
add_entry(ishwor, img, "BIKAGI PEANUT 175gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=82.46, bq=60, unit="pkt"),
    row("082-04-10", "Sales bill no. 197", iq=60, bq=0, unit="pkt"),
])
add_entry(ishwor, img, "NIP BAR TUB 500gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=78.55, bq=312, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=24, bq=288, unit="p"),
    row("082-04-05", "11 - 013", iq=24, bq=264, unit="p"),
    row("082-04-10", "11 - 124", iq=24, bq=240, unit="p"),
    row("082-04-20", "11 - 222", iq=24, bq=216, unit="p"),
    row("082-04-30", "11 - 231", iq=96, bq=120, unit="p"),
])
add_entry(ishwor, img, "NIP BAR 300gm", "", "pkt", [
    row("082-04-01", "श्रीकृष्ण", ra=94.83, bq=300, unit="pkt"),
    row("082-04-05", "Sales bill 012", iq=20, bq=280, unit="p"),
    row("082-04-05", "11 - 013", iq=100, bq=180, unit="p"),
    row("082-04-09", "11 - 029", iq=20, bq=160, unit="p"),
    row("082-04-30", "11 - 231", iq=100, bq=60, unit="p"),
])

# ===== IMAGE 17 (ishwor) =====
img = "IMG_20260526_152133.jpg"
add_entry(ishwor, img, "AABHAS MASALA TEA 25gm", "", "kg", [
    row("082-04-01", "श्रीकृष्ण", ra=377.45, bq=966, unit="kg")
])
add_entry(ishwor, img, "AABHAS MASALA TEA 100gm", "", "kg", [
    row("082-04-01", "श्रीकृष्ण", ra=363.72, bq=60, unit="kg")
])
add_entry(ishwor, img, "AABHASH MASALA TEA 50gm", "", "kg", [
    row("082-04-01", "श्रीकृष्ण", ra=363.72, bq=24, unit="kg")
])
add_entry(ishwor, img, "AABHASH MASALA TEA 200gm", "", "kg", [
    row("082-04-01", "श्रीकृष्ण", ra=363.72, bq=288, unit="kg"),
    row("082-04-10", "Sales bill no. 170", iq=40, bq=248, unit="kg"),
])

# ===== IMAGE 18 (ishwor) =====
img = "IMG_20260526_152135.jpg"
add_entry(ishwor, img, "AABHAS MASALA TEA 500gm", "", "kg", [
    row("082-04-01", "श्रीकृष्ण", ra=363.72, bq=414, unit="kg"),
    row("082-04-10", "Sales bill no. 170", iq=40, bq=374, unit="kg"),
])
add_entry(ishwor, img, "GCU PACKET JHURUM CHIURA 400gm (30pkt)", "", "ctn", [
    row("082-04-04", "purchase bill 96058-28", rq=32, ra=1490, bq=37, unit="ctn"),
    row("082-04-06", "Sales bill 014", iq=5, bq=32, unit="ctn"),
    row("082-04-07", "11 - 031", iq=1, bq=31, unit="ctn"),
    row("082-04-09", "11 - 070", iq=1, bq=30, unit="ctn"),
    row("082-04-10", "purchase bill 268", rq=93, bq=123, unit="ctn"),
    row("082-04-10", "Sales bill no. 186", iq=2, bq=121, unit="ctn"),
    row("082-04-10", "Sales bill no. 187", iq=1, bq=120, unit="ctn"),
    row("082-04-21", "11 - 205", iq=2, bq=118, unit="ctn"),
    row("082-04-30", "11 - 306", iq=5, bq=113, unit="ctn"),
    row("082-08-21", "11 - 371", iq=4, bq=109, unit="ctn"),
    row("082-08-23", "11 - 378", iq=10, bq=99, unit="ctn"),
    row("082-08-23", "11 - 379", iq=10, bq=89, unit="ctn"),
    row("082-08-25", "11 - 387", iq=6, bq=83, unit="ctn"),
    row("082-09-14", "11 - 441", iq=10, bq=73, unit="ctn"),
    row("082-09-15", "11 - 443", iq=10, bq=63, unit="ctn"),
    row("082-11-24", "11 - 581", iq=15, bq=48, unit="ctn"),
    row("082-12-07", "11 - 606", iq=10, bq=38, unit="ctn"),
    row("083-01-02", "11 - 651", iq=20, bq=18, unit="ctn"),
])
add_entry(ishwor, img, "AABHAS MASALA TEA 1 KG", "", "kg", [
    row("082-04-01", "श्रीकृष्ण", ra=363.72, bq=180, unit="kg")
])

# ===== IMAGE 19 (ishwor) =====
img = "IMG_20260526_152137.jpg"
add_entry(ishwor, img, "GCU PACKET JHURUM CHIURA 700gm 20pkt", "", "ctn", [
    row("082-04-04", "purchase bill 96058-28", rq=20, ra=1665, bq=30, unit="ctn"),
    row("082-04-06", "Sales bill 014", iq=5, bq=25, unit="ctn"),
    row("082-04-07", "11 - 031", iq=1, bq=24, unit="ctn"),
    row("082-04-09", "11 - 070", iq=1, bq=23, unit="ctn"),
    row("082-04-10", "purchase bill 301", rq=50, ra=1665, bq=73, unit="bag"),
    row("082-04-10", "Sales bill no. 186", iq=2, bq=71, unit="ctn"),
    row("082-04-10", "Sales bill no. 187", iq=1, bq=70, unit="ctn"),
    row("082-04-21", "11 - 205", iq=2, bq=68, unit="ctn"),
    row("082-04-30", "11 - 304", iq=5, bq=63, unit="ctn"),
    row("082-04-30", "11 - 306", iq=5, bq=58, unit="ctn"),
    row("082-08-21", "11 - 371", iq=4, bq=54, unit="ctn"),
    row("082-08-23", "11 - 378", iq=10, bq=44, unit="ctn"),
    row("082-08-23", "11 - 379", iq=10, bq=34, unit="ctn"),
    row("082-08-25", "11 - 387", iq=6, bq=28, unit="ctn"),
    row("082-09-14", "11 - 441", iq=10, bq=18, unit="ctn"),
    row("082-09-15", "11 - 443", iq=10, bq=8, unit="ctn"),
    row("082-11-24", "11 - 581", iq=12, bq=0, unit="ctn"),
])
add_entry(ishwor, img, "GCU POKHARALI JAICHIN CHIURA 700gm 20pkt", "", "bag", [
    row("082-04-04", "purchase bill 96058-28", rq=25, ra=1450, bq=25, unit="bag"),
    row("082-04-23", "Sales bill no. 378", iq=10, bq=15, unit="ctn"),
    row("082-09-14", "11 - 441", iq=10, bq=5, unit="ctn"),
    row("082-09-15", "11 - 443", iq=5, bq=0, unit="ctn"),
])

# ===== IMAGE 20 (ishwor) =====
img = "IMG_20260526_152139.jpg"
add_entry(ishwor, img, "OSSUM MOBILE SPRAY 25ml (MIX)", "", "ps", [
    row("082-04-04", "purchase bill 086", rq=60, ra=9531, bq=60, unit="ps"),
    row("082-04-05", "Sales bill 013", iq=60, bq=0, unit="ps"),
    row("082-05-14", "Purchase bill 093", rq=96, ra=9530, bq=96, unit="ps"),
    row("082-05-16", "Sales bill no. 117", iq=96, bq=0, unit="ps"),
])
add_entry(ishwor, img, "OSSUM ROLL ON 50ml (MIX)", "", "ps", [
    row("082-04-09", "purchase bill 086", rq=52, ra=242.69, bq=52, unit="ps"),
    row("082-04-16", "Sales bill 025", iq=18, bq=34, unit="ps"),
    row("082-05-14", "Purchase bill 093", rq=12, ra=242.69, bq=12, unit="ps"),
    row("082-05-16", "Sales bill no. 112", iq=12, bq=0, unit="ps"),
    row("082-05-16", "Purchase bill no. 022", rq=60, bq=60, unit="ps"),
    row("082-07-08", "Sales bill no. 350", iq=60, bq=0, unit="ps"),
])
add_entry(ishwor, img, "STREAX HAIR SERUM 45ml", "", "ps", [
    row("082-04-04", "purchase bill 086", rq=72, ra=125.94, bq=72, unit="ps"),
    row("082-04-13", "Sales bill 047", iq=72, bq=0, unit="ps"),
    row("082-04-21", "Purchase bill 211", rq=48, ra=125.32, bq=48, unit="ps"),
    row("082-04-21", "Sales bill no. 350", iq=24, bq=24, unit="ps"),
])

# ===== IMAGE 21 (ishwor) =====
img = "IMG_20260526_152141.jpg"
add_entry(ishwor, img, "915 AA BLUE BATTERY", "", "p", [
    row("082-04-01", "श्रीकृष्ण", rq=2400, rr=11.07, bq=2400, unit="p"),
    row("082-04-08", "Sales bill 052", iq=1200, bq=1200, unit="p"),
    row("082-04-24", "Purchase bill 053", rq=6600, rr=10.05, bq=7200, unit="p"),
    row("082-05-14", "Purchase bill 093", rq=1200, bq=8400, unit="p"),
    row("082-05-16", "Sales bill no. 125", iq=2400, bq=6000, unit="p"),
    row("082-08-08", "Sales bill no. 329", iq=1200, bq=4800, unit="p"),
    row("09/12", "11 - 478", iq=2400, bq=2400, unit="p"),
    row("10/12", "11 - 495", iq=2400, bq=0, unit="p"),
])
add_entry(ishwor, img, "HOKEE CANNED WHOLE MUSHROOM 425gm", "2003", "can", [
    row("082-04-08", "purchase bill T-0010", rq=240, ra=120.62, bq=240, unit="can"),
    row("082-04-18", "Sales bill 53", iq=120, bq=120, unit="can"),
    row("082-04-20", "11 - 058", iq=48, bq=72, unit="can"),
    row("082-05-04", "11 - 096", iq=6, bq=66, unit="can"),
    row("082-04-24", "11 - 241", iq=12, bq=54, unit="can"),
    row("082-04-30", "11 - 235", iq=40, bq=14, unit="can"),
])
add_entry(ishwor, img, "ROZA FRIED MACKEREL W/CHILLI SAUCE 140gm", "1604", "can", [
    row("082-04-08", "purchase bill T-0010", rq=96, ra=139.10, bq=96, unit="can"),
    row("082-04-14", "Sales bill 041", iq=48, bq=48, unit="can"),
    row("082-04-24", "Sales bill no. 212", iq=12, bq=36, unit="can"),
    row("082-04-30", "Sales bill no. 235", iq=30, bq=6, unit="can"),
])

# ===== IMAGE 22 (ishwor) =====
img = "IMG_20260526_152143.jpg"
add_entry(ishwor, img, "ROZA FRIED MACKEREL W/CHILLI SAUCE AND CUMIN 140gm", "1604", "can", [
    row("082-04-08", "purchase bill T-0010", rq=96, ra=139.10, bq=96, unit="can"),
    row("082-04-10", "Sales bill no. 178", iq=24, bq=72, unit="can"),
    row("082-04-10", "Sales bill no. 189", iq=6, bq=66, unit="can"),
    row("082-04-24", "Sales bill no. 212", iq=12, bq=54, unit="can"),
    row("082-04-30", "Sales bill no. 235", iq=40, bq=14, unit="can"),
    row("082-07-15", "Sales bill no. 257", iq=12, bq=2, unit="can"),
    row("09/14", "S.B 440", iq=20, bq=0, unit="can"),
    row("09/20", "Sales return", rq=24, bq=24, unit="can"),
])
add_entry(ishwor, img, "ROZA MACKEREL IN TAMATO SAUCE 155gm", "1604", "can", [
    row("082-04-08", "purchase bill T-0010", rq=48, ra=113.41, bq=48, unit="can"),
    row("082-04-10", "Sales bill no. 178", iq=24, bq=24, unit="can"),
    row("082-04-10", "Sales bill no. 189", iq=6, bq=18, unit="can"),
    row("082-04-24", "Sales bill no. 212", iq=12, bq=6, unit="can"),
    row("082-04-30", "Sales bill no. 235", iq=0, bq=6, unit="can", unclear=True),
    row("082-07-15", "Sales bill no. 257", iq=12, bq=0, unit="can"),
    row("09/20", "Sales return", rq=24, bq=24, unit="can"),
])
add_entry(ishwor, img, "ROZA SARDINE IN TAMATO SAUCE WITH CUMINS 185gm", "1604", "can", [
    row("082-04-08", "purchase bill T-0010", rq=96, ra=139.10, bq=96, unit="can"),
    row("082-04-24", "Sales bill no. 212", iq=12, bq=84, unit="can"),
    row("082-04-30", "Sales bill no. 235", iq=40, bq=44, unit="can"),
    row("082-07-15", "Sales bill no. 257", iq=12, bq=32, unit="can"),
    row("09/14", "S.B 440", iq=20, bq=12, unit="can"),
    row("09/20", "Sales return", rq=12, bq=24, unit="can"),
])
add_entry(ishwor, img, "ROZA SARDINE IN TOMATO SAUCE WITH MASALA 185gm", "1604", "can", [
    row("082-04-08", "purchase bill T-0010", rq=96, ra=139.10, bq=96, unit="can"),
    row("082-04-10", "Sales bill no. 178", iq=24, bq=72, unit="can"),
    row("082-04-10", "Sales bill no. 189", iq=6, bq=66, unit="can"),
    row("082-04-24", "Sales bill no. 212", iq=12, bq=54, unit="can"),
    row("082-04-30", "Sales bill no. 235", iq=40, bq=14, unit="can"),
    row("09/14", "S.B 440", iq=16, bq=0, unit="can"),
    row("09/20", "Sales return", rq=12, bq=12, unit="can"),
])

output = {"batch": 3, "entries": entries}
with open("/Users/abhi/proj/personal/meropasal/data_batch_3.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Written {len(entries)} entries with {sum(len(e['rows']) for e in entries)} total rows")
