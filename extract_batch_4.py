import json

entries = []
orgId = "org_01KMQ64JBVZFTKQYGTHE1PX7R8"

def add_entry(imageFile, productName, productCode, unit, rows):
    entries.append({
        "orgId": orgId,
        "imageFile": imageFile,
        "productName": productName,
        "productCode": productCode,
        "unit": unit,
        "rows": rows
    })

# ==================== IMAGE 1: IMG_20260526_152145.jpg ====================
# Left page 162: LOTTE CHOCO PIE CHOCO BURST (1905)
add_entry("IMG_20260526_152145.jpg", "LOTTE CHOCO PIE CHOCO BURST", "1905", "ctn", [
    {"date": "082-04-15", "particulars": "purchase bill 150112", "receiptQty": 10, "receiptRate": 319.1667, "receiptAmount": 3191.66, "issuedQty": None, "balanceQty": 10, "unit": "ctn", "unclear": False},
    {"date": "082-05-04", "particulars": "Sales bill 096", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 9, "unit": "ctn", "unclear": False},
    {"date": "082-05-15", "particulars": "Sales bill 133", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 8, "unit": "ctn", "unclear": False},
    {"date": "082-06-28", "particulars": "Sales bill 220", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 8, "balanceQty": None, "unit": "ctn", "unclear": True},
    {"date": "082-07-20", "particulars": "Purchase bill no. 1460", "receiptQty": 10, "receiptRate": 325.00, "receiptAmount": 3250.00, "issuedQty": None, "balanceQty": 10, "unit": "ctn", "unclear": False},
    {"date": "082-08-03", "particulars": "Sales bill no. 317", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 9, "unit": "ctn", "unclear": False},
    {"date": "082-08-06", "particulars": "Sales bill 325", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 8, "unit": "ctn", "unclear": False},
    {"date": "082-08-16", "particulars": "Sales bill 326", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 2, "balanceQty": 6, "unit": "ctn", "unclear": False},
    {"date": "082-08-19", "particulars": "Sales bill 355", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 5, "unit": "ctn", "unclear": False},
    {"date": "082-08-20", "particulars": "Sales bill 398", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 4, "unit": "ctn", "unclear": False},
    {"date": "082-09-11", "particulars": "Sales bill 430", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 1, "balanceQty": 3, "unit": "ctn", "unclear": False},
    {"date": "082-11-25", "particulars": "Sales bill 582", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 3, "balanceQty": None, "unit": "ctn", "unclear": True},
])

# Right page 163: 9CU GANDAKI JHURUM CHIURA 400 gm (10 kg)
add_entry("IMG_20260526_152145.jpg", "9CU GANDAKI JHURUM CHIURA 400 gm", None, "bag", [
    {"date": "082-04-23", "particulars": "purchase bill 199", "receiptQty": 141, "receiptRate": 8.135, "receiptAmount": 1147.00, "issuedQty": None, "balanceQty": 141, "unit": "bag", "unclear": False},
    {"date": "082-05-15", "particulars": "Sales bill 117", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 50, "balanceQty": 91, "unit": "bag", "unclear": False},
    {"date": "082-05-16", "particulars": "Sales bill 441", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 81, "unit": "bag", "unclear": False},
    {"date": "082-07-15", "particulars": "Sales bill 442", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 25, "balanceQty": 56, "unit": "bag", "unclear": False},
    {"date": "082-08-24", "particulars": "Sales bill 581", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 41, "unit": "bag", "unclear": False},
    {"date": "082-12-07", "particulars": "Sales bill 606", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 20, "balanceQty": 21, "unit": "bag", "unclear": False},
    {"date": "082-01-02", "particulars": "Sales bill 651", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 6, "unit": "bag", "unclear": False},
])

# ==================== IMAGE 2: IMG_20260526_152147.jpg ====================
# Left page 164: 9CU PACKET JHURUM CHIURA (700gm)
add_entry("IMG_20260526_152147.jpg", "9CU PACKET JHURUM CHIURA (700gm)", None, "bag", [
    {"date": "082-04-23", "particulars": "purchase bill 199", "receiptQty": 30, "receiptRate": 86.00, "receiptAmount": 2580.00, "issuedQty": None, "balanceQty": 30, "unit": "bag", "unclear": False},
    {"date": "082-05-15", "particulars": "Sales bill 118", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 30, "unit": "bag", "unclear": True},
    {"date": "082-07-14", "particulars": "Sales bill 441", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": None, "unit": "bag", "unclear": True},
])

# Right page 165: M42 ZOHO PREMIUM PANTS (9619.00.11)
add_entry("IMG_20260526_152147.jpg", "M42 ZOHO PREMIUM PANTS", "9619.00.11", "p", [
    {"date": "082-05-13", "particulars": "purchase bill 00240", "receiptQty": 50, "receiptRate": 853.98, "receiptAmount": 42699.00, "issuedQty": None, "balanceQty": 50, "unit": "p", "unclear": False},
    {"date": "082-05-18", "particulars": "Sales bill 131", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 3, "balanceQty": 47, "unit": "p", "unclear": False},
    {"date": "082-06-12", "particulars": "Sales bill no. 194", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 20, "balanceQty": 27, "unit": "p", "unclear": False},
    {"date": "082-06-29", "particulars": "Purchase bill no. 767", "receiptQty": 100, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 127, "unit": "p", "unclear": True},
    {"date": "082-06-30", "particulars": "Sales bill no. 230", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 20, "balanceQty": 107, "unit": "p", "unclear": False},
    {"date": "082-07-09", "particulars": "Sales bill 241", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 92, "unit": "p", "unclear": False},
    {"date": "082-07-10", "particulars": "Sales bill 246", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 87, "unit": "p", "unclear": False},
    {"date": "082-07-12", "particulars": "Sales bill 249", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 82, "unit": "p", "unclear": False},
    {"date": "082-07-13", "particulars": "Sales bill 251", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 77, "unit": "p", "unclear": False},
    {"date": "082-07-14", "particulars": "Sales bill 253", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 72, "unit": "p", "unclear": False},
    {"date": "082-07-15", "particulars": "Sales bill 254", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 67, "unit": "p", "unclear": False},
    {"date": "082-07-16", "particulars": "Sales bill 259", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 62, "unit": "p", "unclear": False},
    {"date": "082-08-03", "particulars": "Sales bill 319", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 57, "unit": "p", "unclear": False},
    {"date": "082-08-17", "particulars": "Sales bill 359", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 47, "unit": "p", "unclear": False},
    {"date": "082-08-21", "particulars": "Sales bill 372", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 37, "unit": "p", "unclear": False},
    {"date": "082-08-28", "particulars": "Sales bill 406", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 22, "unit": "p", "unclear": False},
    {"date": "082-09-08", "particulars": "Purchase bill no. 1814", "receiptQty": 25, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 47, "unit": "p", "unclear": True},
    {"date": "082-09-20", "particulars": "Sales bill no. 455", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 42, "unit": "p", "unclear": False},
    {"date": "082-11-04", "particulars": "Sales bill 538", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 32, "unit": "p", "unclear": False},
    {"date": "082-11-22", "particulars": "Sales bill 571", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 17, "unit": "p", "unclear": False},
])

# ==================== IMAGE 3: IMG_20260526_152149.jpg ====================
# Left page 166: L40 ZOHO PREMIUM PANTS (9619.00.11)
add_entry("IMG_20260526_152149.jpg", "L40 ZOHO PREMIUM PANTS", "9619.00.11", "p", [
    {"date": "082-05-13", "particulars": "purchase bill 00240", "receiptQty": 50, "receiptRate": 853.98, "receiptAmount": 42699.00, "issuedQty": None, "balanceQty": 50, "unit": "p", "unclear": False},
    {"date": "082-05-18", "particulars": "Sales bill 131", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 3, "balanceQty": 47, "unit": "p", "unclear": False},
    {"date": "082-06-12", "particulars": "Sales bill no. 194", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 20, "balanceQty": 27, "unit": "p", "unclear": False},
    {"date": "082-06-29", "particulars": "Purchase bill no. 767", "receiptQty": 100, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 127, "unit": "p", "unclear": True},
    {"date": "082-06-30", "particulars": "Sales bill no. 230", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 117, "unit": "p", "unclear": False},
    {"date": "082-07-09", "particulars": "Sales bill 241", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 102, "unit": "p", "unclear": False},
    {"date": "082-07-10", "particulars": "Sales bill 246", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 97, "unit": "p", "unclear": False},
    {"date": "082-07-12", "particulars": "Sales bill 249", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 92, "unit": "p", "unclear": False},
    {"date": "082-07-13", "particulars": "Sales bill 251", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 87, "unit": "p", "unclear": False},
    {"date": "082-07-14", "particulars": "Sales bill 253", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 82, "unit": "p", "unclear": False},
    {"date": "082-07-15", "particulars": "Sales bill 254", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 77, "unit": "p", "unclear": False},
    {"date": "082-07-16", "particulars": "Sales bill 259", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 72, "unit": "p", "unclear": False},
    {"date": "082-08-03", "particulars": "Sales bill 319", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 67, "unit": "p", "unclear": False},
    {"date": "082-08-17", "particulars": "Sales bill 359", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 62, "unit": "p", "unclear": False},
    {"date": "082-08-21", "particulars": "Sales bill 372", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 52, "unit": "p", "unclear": False},
    {"date": "082-08-28", "particulars": "Sales bill 406", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 42, "unit": "p", "unclear": False},
    {"date": "082-09-08", "particulars": "Purchase bill no. 1814", "receiptQty": 25, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 67, "unit": "p", "unclear": True},
    {"date": "082-09-20", "particulars": "Sales bill no. 455", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 62, "unit": "p", "unclear": False},
    {"date": "082-11-04", "particulars": "Sales bill 538", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 52, "unit": "p", "unclear": False},
    {"date": "082-11-22", "particulars": "Sales bill 571", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 42, "unit": "p", "unclear": False},
])

# Right page 167: XL36 ZOHO PREMIUM PANTS (9619.00.11)
add_entry("IMG_20260526_152149.jpg", "XL36 ZOHO PREMIUM PANTS", "9619.00.11", "p", [
    {"date": "082-05-13", "particulars": "purchase bill 00240", "receiptQty": 25, "receiptRate": 853.98, "receiptAmount": 21349.50, "issuedQty": None, "balanceQty": 25, "unit": "p", "unclear": False},
    {"date": "082-05-18", "particulars": "Sales bill 131", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 3, "balanceQty": 22, "unit": "p", "unclear": False},
    {"date": "082-06-12", "particulars": "Sales bill no. 194", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 22, "unit": "p", "unclear": True},
    {"date": "082-06-29", "particulars": "Purchase bill no. 767", "receiptQty": 75, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 97, "unit": "p", "unclear": True},
    {"date": "082-06-30", "particulars": "Sales bill no. 230", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 87, "unit": "p", "unclear": False},
    {"date": "082-07-09", "particulars": "Sales bill 241", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 15, "balanceQty": 72, "unit": "p", "unclear": False},
    {"date": "082-07-10", "particulars": "Sales bill 246", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 67, "unit": "p", "unclear": False},
    {"date": "082-07-12", "particulars": "Sales bill 249", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 62, "unit": "p", "unclear": False},
    {"date": "082-07-13", "particulars": "Sales bill 251", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 57, "unit": "p", "unclear": False},
    {"date": "082-07-14", "particulars": "Sales bill 253", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 52, "unit": "p", "unclear": False},
    {"date": "082-07-15", "particulars": "Sales bill 254", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 47, "unit": "p", "unclear": False},
    {"date": "082-07-16", "particulars": "Sales bill 259", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 42, "unit": "p", "unclear": False},
    {"date": "082-08-03", "particulars": "Sales bill 319", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 37, "unit": "p", "unclear": False},
    {"date": "082-08-17", "particulars": "Sales bill 359", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 32, "unit": "p", "unclear": False},
    {"date": "082-08-21", "particulars": "Sales bill 372", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 22, "unit": "p", "unclear": False},
    {"date": "082-09-08", "particulars": "Purchase bill no. 1814", "receiptQty": 25, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 47, "unit": "p", "unclear": True},
    {"date": "082-09-20", "particulars": "Sales bill no. 455", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 42, "unit": "p", "unclear": False},
])

print(f"Entries so far: {len(entries)}")

# ==================== IMAGE 4: IMG_20260526_152151.jpg ====================
# Left page 168: XXL36 ZOHO PREMIUM PANTS (9619.00.11)
add_entry("IMG_20260526_152151.jpg", "XXL36 ZOHO PREMIUM PANTS", "9619.00.11", "p", [
    {"date": "082-05-13", "particulars": "purchase bill 00240", "receiptQty": 25, "receiptRate": 853.98, "receiptAmount": 21349.50, "issuedQty": None, "balanceQty": 25, "unit": "p", "unclear": False},
    {"date": "082-05-18", "particulars": "Sales bill 131", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 3, "balanceQty": 22, "unit": "p", "unclear": False},
    {"date": "082-06-12", "particulars": "Sales bill no. 194", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 22, "unit": "p", "unclear": True},
    {"date": "082-06-29", "particulars": "Purchase bill no. 767", "receiptQty": 75, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 97, "unit": "p", "unclear": True},
    {"date": "082-06-30", "particulars": "Sales bill no. 230", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 87, "unit": "p", "unclear": False},
    {"date": "082-07-09", "particulars": "Sales bill 241", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 77, "unit": "p", "unclear": False},
    {"date": "082-07-10", "particulars": "Sales bill 246", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 72, "unit": "p", "unclear": False},
    {"date": "082-07-12", "particulars": "Sales bill 249", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 67, "unit": "p", "unclear": False},
    {"date": "082-07-13", "particulars": "Sales bill 251", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 62, "unit": "p", "unclear": False},
    {"date": "082-07-14", "particulars": "Sales bill 253", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 57, "unit": "p", "unclear": False},
    {"date": "082-07-15", "particulars": "Sales bill 254", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 52, "unit": "p", "unclear": False},
    {"date": "082-07-16", "particulars": "Sales bill 259", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 47, "unit": "p", "unclear": False},
    {"date": "082-08-03", "particulars": "Sales bill 319", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 42, "unit": "p", "unclear": False},
    {"date": "082-08-17", "particulars": "Sales bill 359", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 37, "unit": "p", "unclear": False},
    {"date": "082-08-21", "particulars": "Sales bill 372", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 27, "unit": "p", "unclear": False},
    {"date": "082-09-08", "particulars": "Purchase bill no. 1814", "receiptQty": 25, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 52, "unit": "p", "unclear": True},
    {"date": "082-09-20", "particulars": "Sales bill no. 455", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 5, "balanceQty": 47, "unit": "p", "unclear": False},
])

# Right page 169: MCV DIGESTIVE 959.14m (1305)
add_entry("IMG_20260526_152151.jpg", "MCV DIGESTIVE 959.14m", "1305", "pkt", [
    {"date": "082-05-15", "particulars": "purchase bill 0498", "receiptQty": 20, "receiptRate": 338.341, "receiptAmount": 6766.82, "issuedQty": None, "balanceQty": 20, "unit": "pkt", "unclear": False},
    {"date": "082-06-10", "particulars": "Sales bill no. 184", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 10, "balanceQty": 10, "unit": "pkt", "unclear": False},
])

# ==================== IMAGE 5: IMG_20260526_152152.jpg ====================
# Left page 170 top: S.F. COOKIES CHOCO CHIPS 150gm (1905)
add_entry("IMG_20260526_152152.jpg", "S.F. COOKIES CHOCO CHIPS 150gm", "1905", "p", [
    {"date": "082-05-15", "particulars": "purchase bill 01498", "receiptQty": 24, "receiptRate": 158.331, "receiptAmount": 3799.94, "issuedQty": None, "balanceQty": 24, "unit": "p", "unclear": False},
    {"date": "082-05-19", "particulars": "Sales bill 134", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 6, "balanceQty": 18, "unit": "p", "unclear": False},
    {"date": "082-05-20", "particulars": "Sales bill 136", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 6, "balanceQty": 12, "unit": "p", "unclear": False},
    {"date": "082-10-16", "particulars": "Purchase bill no. 6173", "receiptQty": 120, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 132, "unit": "p", "unclear": True},
    {"date": "082-11-19", "particulars": "Sales bill no. 563", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 24, "balanceQty": 108, "unit": "p", "unclear": False},
    {"date": "082-11-24", "particulars": "Sales bill 578", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 12, "balanceQty": 96, "unit": "p", "unclear": False},
])

# Left page 170 bottom: S.F. COOKIES YUMMY BERRY 150gm (1905)
add_entry("IMG_20260526_152152.jpg", "S.F. COOKIES YUMMY BERRY 150gm", "1905", "p", [
    {"date": "082-05-15", "particulars": "purchase bill 01498", "receiptQty": 24, "receiptRate": 158.331, "receiptAmount": 3799.94, "issuedQty": None, "balanceQty": 24, "unit": "p", "unclear": False},
    {"date": "082-05-19", "particulars": "Sales bill 134", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 6, "balanceQty": 18, "unit": "p", "unclear": False},
    {"date": "082-05-20", "particulars": "Sales bill 136", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 6, "balanceQty": 12, "unit": "p", "unclear": False},
    {"date": "082-10-16", "particulars": "Purchase bill no. 6173", "receiptQty": 120, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 132, "unit": "p", "unclear": True},
    {"date": "082-11-19", "particulars": "Sales bill no. 563", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 24, "balanceQty": 108, "unit": "p", "unclear": False},
    {"date": "082-11-24", "particulars": "Sales bill 578", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 12, "balanceQty": 96, "unit": "p", "unclear": False},
])

# Right page 171: SANTOOR ORANGE SOAP 100gm (3401)
add_entry("IMG_20260526_152152.jpg", "SANTOOR ORANGE SOAP 100gm", "3401", "ps", [
    {"date": "082-05-15", "particulars": "purchase bill 1076", "receiptQty": 960, "receiptRate": 35.98, "receiptAmount": 34540.80, "issuedQty": None, "balanceQty": 960, "unit": "ps", "unclear": False},
    {"date": "082-05-30", "particulars": "Purchase bill no. 1201", "receiptQty": 1440, "receiptRate": 37.24, "receiptAmount": 53625.60, "issuedQty": None, "balanceQty": 2400, "unit": "ps", "unclear": False},
    {"date": "082-06-12", "particulars": "Sales bill no. 200", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 360, "balanceQty": 2040, "unit": "ps", "unclear": False},
    {"date": "082-06-13", "particulars": "Sales bill no. 201", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 960, "balanceQty": 1080, "unit": "ps", "unclear": False},
    {"date": "082-06-24", "particulars": "Sales bill no. 211", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 96, "balanceQty": 984, "unit": "ps", "unclear": False},
    {"date": "082-06-26", "particulars": "Purchase bill no. 1674", "receiptQty": 3360, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 4344, "unit": "ps", "unclear": True},
    {"date": "082-06-30", "particulars": "Sales bill no. 227", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 192, "balanceQty": 4152, "unit": "ps", "unclear": False},
    {"date": "082-06-30", "particulars": "Sales bill no. 232", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 960, "balanceQty": 3192, "unit": "ps", "unclear": False},
    {"date": "082-07-09", "particulars": "Sales bill no. 239", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 960, "balanceQty": 2232, "unit": "ps", "unclear": False},
    {"date": "082-07-09", "particulars": "Sales bill 241", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 192, "balanceQty": 2040, "unit": "ps", "unclear": False},
    {"date": "082-07-14", "particulars": "Purchase bill 2078", "receiptQty": 2400, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 4440, "unit": "ps", "unclear": True},
    {"date": "082-07-15", "particulars": "Sales bill no. 256", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 48, "balanceQty": 4392, "unit": "ps", "unclear": False},
    {"date": "082-07-25", "particulars": "Sales bill 277", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 960, "balanceQty": 3432, "unit": "ps", "unclear": False},
    {"date": "082-07-25", "particulars": "Sales bill 283", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 96, "balanceQty": 3336, "unit": "ps", "unclear": False},
    {"date": "082-07-28", "particulars": "Sales bill 287", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 96, "balanceQty": 3240, "unit": "ps", "unclear": False},
    {"date": "082-07-30", "particulars": "Sales bill 302", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 960, "balanceQty": 2280, "unit": "ps", "unclear": False},
    {"date": "082-07-30", "particulars": "Sales bill 305", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 288, "balanceQty": 1992, "unit": "ps", "unclear": False},
    {"date": "082-08-01", "particulars": "Sales bill 313", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 192, "balanceQty": 1800, "unit": "ps", "unclear": False},
    {"date": "082-08-20", "particulars": "Sales bill 370", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 384, "balanceQty": 1416, "unit": "ps", "unclear": False},
    {"date": "082-08-24", "particulars": "Sales bill 383", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 480, "balanceQty": 936, "unit": "ps", "unclear": False},
    {"date": "082-08-28", "particulars": "Sales bill 399", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 96, "balanceQty": 840, "unit": "ps", "unclear": False},
    {"date": "082-09-08", "particulars": "Purchase bill no. 3754", "receiptQty": 1632, "receiptRate": 35.75, "receiptAmount": 58344.00, "issuedQty": None, "balanceQty": 2472, "unit": "ps", "unclear": False},
    {"date": "082-09-23", "particulars": "Sales bill no. 465", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 192, "balanceQty": 2280, "unit": "ps", "unclear": False},
    {"date": "082-10-24", "particulars": "Sales bill 572", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 480, "balanceQty": 1800, "unit": "ps", "unclear": False},
    {"date": "082-10-29", "particulars": "Sales bill 526", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 384, "balanceQty": 1416, "unit": "ps", "unclear": False},
    {"date": "082-11-03", "particulars": "Sales bill 532", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 192, "balanceQty": 1224, "unit": "ps", "unclear": False},
    {"date": "082-11-07", "particulars": "Sales bill 538", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 288, "balanceQty": 936, "unit": "ps", "unclear": False},
    {"date": "082-11-08", "particulars": "Purchase bill 5301", "receiptQty": 1920, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 2856, "unit": "ps", "unclear": True},
    {"date": "082-11-10", "particulars": "Sales bill no. 544", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 960, "balanceQty": 1896, "unit": "ps", "unclear": False},
    {"date": "082-11-12", "particulars": "Sales bill 548", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 480, "balanceQty": 1416, "unit": "ps", "unclear": False},
    {"date": "082-11-16", "particulars": "Sales bill 555", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 192, "balanceQty": 1224, "unit": "ps", "unclear": False},
    {"date": "082-11-19", "particulars": "Sales bill 563", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 96, "balanceQty": 1128, "unit": "ps", "unclear": False},
    {"date": "082-11-20", "particulars": "Sales bill 567", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 384, "balanceQty": 744, "unit": "ps", "unclear": False},
    {"date": "082-11-24", "particulars": "Sales bill 576", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 96, "balanceQty": 648, "unit": "ps", "unclear": False},
    {"date": "082-11-25", "particulars": "Purchase bill 572", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": None, "balanceQty": 648, "unit": "ps", "unclear": True},
    {"date": "082-12-01", "particulars": "Sales bill", "receiptQty": None, "receiptRate": None, "receiptAmount": None, "issuedQty": 480, "balanceQty": 168, "unit": "ps", "unclear": True},
])

print(f"Entries after image 5: {len(entries)}")
