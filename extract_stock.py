#!/usr/bin/env python3
"""Extract stock book data from images using OpenRouter vision API."""

import os
import sys
import json
import base64
import requests
from pathlib import Path

OPENROUTER_KEY = os.environ["OPENROUTER_API_KEY"]

def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def extract_from_image(image_path, org_left, org_right):
    """Send image to vision model and extract structured data."""
    b64 = encode_image(image_path)
    mime = "image/jpeg"
    
    system_prompt = """You are a meticulous data extractor for stock book ledgers.

The image shows a 2-page spread of a handwritten Stock Book. Each page has a product section.

ORG IDENTIFICATION:
- Left page background is RED fabric → orgId: "org_01KMQ64JBVZFTKQYGTHE1PX7R8"
- Right page background is WOODEN table → orgId: "org_01KMQ64R6WHY61G0ZNY43SWN91"

For EACH product section, extract:
- productName: exact name from "Name of Article"
- productCode: number in parentheses if present (e.g., "(250ml)" is NOT a code, but "(1570)" IS a code)
- unit: common unit from remarks column (p, pkt, ctn, gm, ml, pcs, etc.)

For EACH non-empty row in the table, extract:
- date: as written (format like "082-04-01" - keep exact)
- particulars: exact text from particulars column
- receiptQty: numeric quantity in Receipt column, or null
- receiptRate: rate in Receipt column, or null
- receiptAmount: amount in Receipt column, or null
- issuedQty: numeric quantity in Issued column, or null
- balanceQty: numeric quantity in Balance column, or null
- unit: unit for this row (p, pkt, ctn, pcs, etc.)
- unclear: true if any value is hard to read

Parse numbers carefully. "6 p" → qty 6, unit "p". "12 pkt" → qty 12, unit "pkt". "200 ctn" → qty 200, unit "ctn".
Use null (not 0) for missing numeric values.

Return ONLY valid JSON in this exact format:
{
  "products": [
    {
      "orgId": "...",
      "productName": "...",
      "productCode": "...",
      "unit": "...",
      "rows": [
        {
          "date": "082-04-01",
          "particulars": "...",
          "receiptQty": 10,
          "receiptRate": 45.50,
          "receiptAmount": 455.00,
          "issuedQty": null,
          "balanceQty": 100,
          "unit": "p",
          "unclear": false
        }
      ]
    }
  ]
}

If a product section has no rows, still include it with empty rows array.
Be extremely careful with handwritten numbers. If uncertain, mark unclear: true.
"""

    payload = {
        "model": "anthropic/claude-3.5-sonnet",
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Extract all stock book data from this image. Left page org: {org_left}, Right page org: {org_right}"},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
                ]
            }
        ],
        "max_tokens": 4000,
        "temperature": 0.1
    }

    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://localhost",
            "X-Title": "StockBookExtractor"
        },
        json=payload,
        timeout=120
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["choices"][0]["message"]["content"]
    
    # Extract JSON from markdown code blocks if present
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    
    return json.loads(text)

def main():
    image_dir = Path("/Users/abhi/Downloads/Photos 001")
    images = sorted(image_dir.glob("IMG_20260526_*.jpg"))
    
    org_ishwor = "org_01KMQ64JBVZFTKQYGTHE1PX7R8"
    org_anjal = "org_01KMQ64R6WHY61G0ZNY43SWN91"
    
    all_entries = []
    
    for img_path in images:
        print(f"Processing {img_path.name}...", flush=True)
        try:
            result = extract_from_image(str(img_path), org_ishwor, org_anjal)
            for prod in result.get("products", []):
                entry = {
                    "orgId": prod["orgId"],
                    "imageFile": img_path.name,
                    "productName": prod["productName"],
                    "productCode": prod.get("productCode"),
                    "unit": prod.get("unit", ""),
                    "rows": prod.get("rows", [])
                }
                all_entries.append(entry)
            print(f"  ✓ Extracted {len(result.get('products', []))} products", flush=True)
        except Exception as e:
            print(f"  ✗ Error: {e}", flush=True)
            import traceback
            traceback.print_exc()
    
    output = {
        "batch": 5,
        "entries": all_entries
    }
    
    out_path = "/Users/abhi/proj/personal/meropasal/data_batch_5.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nDone! Saved {len(all_entries)} entries to {out_path}")

if __name__ == "__main__":
    main()
