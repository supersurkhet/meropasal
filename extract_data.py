import json

# org IDs
ISHWOR = "org_01KMQ64JBVZFTKQYGTHE1PX7R8"
ANJAL = "org_01KMQ64R6WHY61G0ZNY43SWN91"

def qty(s):
    if s is None or s == "":
        return None
    s = str(s).strip().replace(",", "")
    try:
        return int(s)
    except:
        try:
            return float(s)
        except:
            return None

def rate(s):
    if s is None or s == "":
        return None
    s = str(s).strip().replace(",", "")
    try:
        return float(s)
    except:
        return None

def amt(s):
    if s is None or s == "":
        return None
    s = str(s).strip().replace(",", "")
    try:
        return float(s)
    except:
        return None

def row(d, p, rq=None, rr=None, ra=None, iq=None, bq=None, u="", uc=False):
    return {
        "date": d,
        "particulars": p,
        "receiptQty": qty(rq),
        "receiptRate": rate(rr),
        "receiptAmount": amt(ra),
        "issuedQty": qty(iq),
        "balanceQty": qty(bq),
        "unit": u,
        "unclear": uc
    }

entries = []

# ===================== IMAGE 1: IMG_20260526_151955.jpg (wooden = anjal) =====================
# Page 74 top: DR BONNE FEEDING NIPPLES
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151955.jpg",
    "productName": "DR BONNE FEEDING NIPPLES",
    "productCode": None,
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=1200, u="pc"),
        row("082-04-22", "Sales bill 067", iq=180, bq=1020, u="pc"),
        row("082-04-25", "Purchase bill no. 00075", rq=1200, rr=5.75, ra=6900, iq=15, bq=2205, u="pc"),
        row("082-06-25", "Sales bill no. 213", iq=180, bq=2025, u="pc"),
        row("082-07-24", "\" \" — \" 276", iq=180, bq=1845, u="pc"),
        row("082-08-01", "\" \" — \" 311", iq=180, bq=1665, u="pc"),
        row("082-08-02", "\" \" — \" 314", iq=180, bq=1485, u="pc"),
        row("082-08-08", "Purchase bill no. 696", rq=2400, rr=8.85, ra=21240, iq=1200, bq=645, u="pc"),
        row("082-08-19", "Sales bill no. 364", iq=240, bq=405, u="pc"),
        row("082-10-12", "\" \" — \" 487", iq=450, bq=295, u="pc"),
        row("082-11-16", "\" \" — \" 555", iq=180, bq=115, u="pc"),
        row("082-12-04", "\" \" — \" 602", iq=450, bq=665, u="pc"),
        row("082-12-18", "\" \" — \" 630", iq=600, bq=65, u="pc"),
        row("083-01-18", "\" \" — \" 689", iq=450, bq=615, u="pc"),
    ]
})

# Page 75 top: DR BONNE 125ML FEEDER
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151955.jpg",
    "productName": "DR BONNE 125ML FEEDER",
    "productCode": None,
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=624, u="pc"),
        row("082-04-22", "Sales bill 067", iq=144, bq=480, u="pc"),
        row("082-04-25", "\" \" — \" 276", iq=60, bq=420, u="pc"),
        row("082-07-24", "\" \" — \" 311", iq=36, bq=384, u="pc"),
        row("082-08-01", "Purchase bill no. 696", rq=720, rr=10, ra=7200, iq=72, bq=1104, u="pc"),
        row("082-08-08", "Sales bill no. 364", iq=288, bq=816, u="pc"),
        row("082-08-15", "\" \" — \" 364", iq=144, bq=672, u="pc"),
        row("082-08-19", "\" \" — \" 381", iq=288, bq=384, u="pc"),
        row("082-08-26", "Purchase bill no. 813", rq=1440, rr=11, ra=15840, iq=72, bq=1824, u="pc"),
        row("082-08-28", "Sales bill no. 395", iq=720, bq=1104, u="pc"),
        row("082-09-06", "Purchase bill no. 901", rq=2160, rr=11, ra=23760, iq=72, bq=3264, u="pc"),
        row("082-09-26", "Sales bill no. 471", iq=144, bq=3120, u="pc"),
        row("082-10-12", "\" \" — \" 487", iq=144, bq=2976, u="pc"),
        row("082-11-16", "\" \" — \" 555", iq=288, bq=2688, u="pc"),
        row("082-11-23", "\" \" — \" 574", iq=288, bq=2400, u="pc", uc=True),
        row("082-12-02", "\" \" — \" 591", iq=360, bq=2040, u="pc"),
        row("082-12-09", "\" \" — \" 613", iq=144, bq=1896, u="pc"),
        row("082-12-19", "\" \" — \" 633", iq=288, bq=1608, u="pc"),
    ]
})

# Page 74 bottom: DR BONNE MAXI 250ML FEEDER
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151955.jpg",
    "productName": "DR BONNE MAXI 250ML FEEDER",
    "productCode": None,
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=839, u="pc"),
        row("082-04-22", "Sales bill 067", iq=144, bq=695, u="pc"),
        row("082-07-24", "\" \" — \" 276", iq=60, bq=635, u="pc"),
        row("082-08-01", "\" \" — \" 311", iq=72, bq=563, u="pc"),
        row("082-08-08", "Purchase bill no. 696", rq=720, rr=10, ra=7200, iq=0, bq=1283, u="pc"),
        row("082-08-15", "Sales bill no. 357", iq=288, bq=995, u="pc"),
        row("082-08-26", "Purchase bill no. 813", rq=1440, rr=11, ra=15840, iq=0, bq=2435, u="pc"),
        row("082-09-26", "Sales bill no. 471", iq=144, bq=2291, u="pc"),
        row("082-10-12", "\" \" — \" 487", iq=144, bq=2147, u="pc"),
        row("082-11-16", "\" \" — \" 555", iq=288, bq=1859, u="pc"),
        row("082-11-23", "\" \" — \" 574", iq=288, bq=1571, u="pc"),
        row("082-12-02", "\" \" — \" 591", iq=360, bq=1211, u="pc"),
        row("082-12-09", "\" \" — \" 613", iq=144, bq=1067, u="pc"),
        row("082-12-19", "\" \" — \" 633", iq=288, bq=779, u="pc"),
    ]
})

# Page 75 bottom: TIF BABY TEETHER (9503)
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151955.jpg",
    "productName": "TIF BABY TEETHER",
    "productCode": "9503",
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=18, u="pc"),
        row("082-05-19", "Sales bill 133", iq=12, bq=6, u="pc"),
        row("082-09-08", "Purchase bill no. 696", rq=36, rr=11, ra=396, iq=0, bq=42, u="pc"),
    ]
})

# ===================== IMAGE 2: IMG_20260526_151958.jpg (wooden = anjal) =====================
# Page 76 top: BONNE ACER STEEL FEEDER 250ML (7323)
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151958.jpg",
    "productName": "BONNE ACER STEEL FEEDER 250ML",
    "productCode": "7323",
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=72, u="pc"),
        row("082-04-05", "Sales bill 008", iq=6, bq=66, u="pc"),
        row("082-04-25", "\" \" — \" 009", iq=6, bq=60, u="pc"),
        row("082-06-10", "\" \" — \" 184", iq=12, bq=48, u="pc"),
        row("082-07-13", "\" \" — \" 351", iq=18, bq=30, u="pc"),
        row("082-08-08", "Purchase bill no. 696", rq=144, rr=11, ra=1584, iq=0, bq=174, u="pc"),
        row("082-09-20", "Sales bill no. 486", iq=12, bq=162, u="pc"),
        row("082-10-27", "\" \" — \" 578", iq=6, bq=156, u="pc"),
        row("082-12-08", "\" \" — \" 612", iq=18, bq=138, u="pc"),
    ]
})

# Page 77 top: TIF GL FEEDER HANDLE 250ML SILICONE SLEEVE (7013)
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151958.jpg",
    "productName": "TIF GL FEEDER HANDLE 250ML SILICONE SLEEVE",
    "productCode": "7013",
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=6, u="pc"),
        row("082-04-05", "Sales bill 009", iq=6, bq=0, u="pc"),
        row("082-04-18", "Purchase bill 00075", rq=48, rr=11, ra=528, iq=0, bq=48, u="pc"),
        row("082-08-28", "Sales bill no. 337", iq=12, bq=36, u="pc"),
        row("082-08-29", "\" \" — \" 441", iq=14, bq=22, u="pc"),
    ]
})

# Page 76 bottom: TIF SPIRAL FROSTED LSR NIPPLES (4014)
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151958.jpg",
    "productName": "TIF SPIRAL FROSTED LSR NIPPLES",
    "productCode": "4014",
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=60, u="pc"),
        row("082-06-25", "Sales bill no. 213", iq=10, bq=50, u="pc"),
        row("082-07-03", "\" \" — \" 207", iq=20, bq=30, u="pc"),
        row("082-10-09", "Purchase bill no. 1107", rq=100, rr=18.18, ra=1818, iq=0, bq=130, u="pc"),
        row("082-12-02", "Sales bill no. 591", iq=24, bq=106, u="pc"),
    ]
})

# Page 77 bottom: TIF GL FEEDER HANDLE 125ML SILICONES
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_151958.jpg",
    "productName": "TIF GL FEEDER HANDLE 125ML SILICONES",
    "productCode": None,
    "unit": "pc",
    "rows": [
        row("082-04-01", "Brought", bq=6, u="pc"),
        row("082-04-18", "Purchase bill 00075", rq=48, rr=11, ra=528, iq=0, bq=54, u="pc"),
        row("082-08-28", "Sales bill no. 421", iq=12, bq=42, u="pc"),
    ]
})

# ===================== IMAGE 3: IMG_20260526_152001.jpg (wooden = anjal) =====================
# Page 78: LOTTE CHOCOPAI 12 PACK (1905)
entries.append({
    "orgId": ANJAL,
    "imageFile": "IMG_20260526_152001.jpg",
    "productName": "LOTTE CHOCOPAI 12 PACK",
    "productCode": "1905",
    "unit": "ctn",
    "rows": [
        row("082-04-01", "Brought", bq=110, u="ctn"),
        row("082-04-02", "Sales bill 001", iq=2, bq=108, u="ctn"),
        row("082-04-05", "\" \" — \" 008", iq=1, bq=107, u="ctn"),
        row("082-04-07", "\" \" — \" 820", iq=5, bq=102, u="ctn"),
        row("082-04-08", "\" \" — \" 025", iq=6, bq=96, u="ctn"),
        row("082-04-09", "\" \" — \" 030", iq=2, bq=94, u="ctn"),
        row("082-04-20", "\" \" — \" 57", iq=5, bq=89, u="ctn"),
        row("082-04-21", "\" \" — \" 072", iq=1, bq=88, u="ctn"),
        row("082-04-24", "\" \" — \" 073", iq=3, bq=85, u="ctn"),
        row("082-04-28", "\" \" — \" 086", iq=2, bq=83, u="ctn"),
        row("082-04-29", "\" \" — \" 081", iq=20, bq=63, u="ctn"),
        row("082-04-15", "Purchase bill sb-00127", rq=300, rr=23, ra=6900, iq=0, bq=363, u="ctn"),
        row("082-05-02", "Sales bill 090", iq=10, bq=353, u="ctn"),
        row("082-05-04", "\" \" — \" 096", iq=2, bq=351, u="ctn"),
        row("082-05-11", "\" \" — \" 107", iq=25, bq=326, u="ctn"),
        row("082-05-12", "\" \" — \" 108", iq=35, bq=291, u="ctn"),
        row("082-05-16", "\" \" — \" 122", iq=20, bq=271, u="ctn"),
        row("082-05-19", "\" \" — \" 133", iq=5, bq=266, u="ctn"),
        row("082-05-28", "\" \" — \" 156", iq=20, bq=246, u="ctn"),
        row("082-05-30", "\" \" — \" 158", iq=30, bq=216, u="ctn"),
        row("082-06-09", "\" \" — \" 171", iq=25, bq=191, u="ctn"),
        row("082-06-10", "\" \" — \" 174", iq=10, bq=181, u="ctn"),
        row("082-06-10", "\" \" — \" 183", iq=2, bq=179, u="ctn"),
        row("082-06-10", "\" \" — \" 188", iq=1, bq=178, u="ctn"),
        row("082-06-12", "\" \" — \" 195", iq=15, bq=163, u="ctn"),
        row("082-06-25", "Sales bill no. 214", iq=1, bq=162, u="ctn"),
        row("082-06-25", "Sales bill no. 216", iq=20, bq=142, u="ctn"),
        row("082-06-27", "\" \" — \" 218", iq=21, bq=121, u="ctn"),
        row("082-06-30", "\" \" — \" 225", iq=12, bq=109, u="ctn"),
        row("082-07-09", "\" \" — \" 240", iq=5, bq=104, u="ctn"),
        row("082-07-10", "\" \" — \" 244", iq=20, bq=84, u="ctn"),
        row("082-07-22", "\" \" — \" 273", iq=2, bq=82, u="ctn"),
        row("082-07-24", "\" \" — \" 278", iq=5, bq=77, u="ctn"),
        row("082-07-26", "Purchase bill no. 1460", rq=345, rr=21, ra=7245, iq=0, bq=422, u="ctn"),
    ]
})

print(f"Entries so far: {len(entries)}")

with open("/Users/abhi/proj/personal/meropasal/data_batch_2.json", "w") as f:
    json.dump({"batch": 2, "entries": entries}, f, indent=2)

print("Wrote first chunk")
