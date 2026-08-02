"""Normalize the downloaded public food nutrition files into an app-ready CSV.

The source files remain untouched. db1.csv is treated as the primary, newer
dataset; db.xlsx is added only when its canonical food name is not present in
db1.csv. Energy values stay tied to their declared basis (100g or 100ml) so
the app does not silently invent a serving-size conversion.
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path(r"C:/Users/YC Kim/Downloads")
OUT_DIR = ROOT / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def clean(value) -> str:
    return "" if value is None else str(value).strip()


def canonical(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]", "", clean(value).lower())


def number(value):
    text = clean(value).replace(",", "")
    if not text or text == "-":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def amount_unit(value: str):
    match = re.fullmatch(r"\s*([0-9]+(?:\.[0-9]+)?)\s*(g|ml)\s*", clean(value), re.I)
    if not match:
        return None, None
    return float(match.group(1)), match.group(2).lower()


def iso_date(value: str) -> str:
    value = clean(value)
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value.replace("Z", "")).date().isoformat()
    except ValueError:
        return value[:10]


def load_primary():
    rows = []
    with (DOWNLOADS / "db1.csv").open(encoding="cp949", newline="") as handle:
        source_rows = list(csv.DictReader(handle))

    # Keep the newest record for each product code. Exact duplicate records are
    # common in the download; code is the stable product identifier.
    by_code = {}
    for row in source_rows:
        code = clean(row.get("식품코드"))
        if not code:
            continue
        previous = by_code.get(code)
        if previous is None or iso_date(row.get("데이터생성일자")) >= iso_date(previous.get("데이터생성일자")):
            by_code[code] = row

    for row in by_code.values():
        basis_amount, basis_unit = amount_unit(row.get("영양성분함량기준량"))
        rows.append({
            "food_code": clean(row.get("식품코드")),
            "name": clean(row.get("식품명")),
            "name_key": canonical(row.get("식품명")),
            "category": clean(row.get("데이터구분명")),
            "energy_kcal": number(row.get("에너지(kcal)")),
            "basis_amount": basis_amount,
            "basis_unit": basis_unit,
            "reference_amount": None,
            "reference_unit": "",
            "reference_kcal": None,
            "protein_g": number(row.get("단백질(g)")),
            "fat_g": number(row.get("지방(g)")),
            "carbohydrate_g": number(row.get("탄수화물(g)")),
            "sugars_g": number(row.get("당류(g)")),
            "fiber_g": number(row.get("식이섬유(g)")),
            "sodium_mg": number(row.get("나트륨(mg)")),
            "source": clean(row.get("출처명")),
            "source_kind": "primary_db1",
            "source_created_at": iso_date(row.get("데이터생성일자")),
            "source_reference_date": iso_date(row.get("데이터기준일자")),
        })
    return rows


def load_supplement(existing_keys):
    workbook = openpyxl.load_workbook(DOWNLOADS / "db.xlsx", read_only=True, data_only=True)
    sheet = workbook.active
    raw_rows = list(sheet.iter_rows(values_only=True))
    headers = [clean(value) for value in raw_rows[0]]
    index = {header: position for position, header in enumerate(headers)}
    output = []

    for row in raw_rows[1:]:
        name = clean(row[index["가공식품품목명"]])
        name_key = canonical(name)
        if not name_key or name_key in existing_keys:
            continue
        basis_amount, basis_unit = amount_unit(row[index["영양성분기준용량"]])
        reference_amount, reference_unit = amount_unit(row[index["1회 \n섭취참고량"]])
        energy = number(row[index["에너지\n(kcal)"]])
        reference_kcal = None
        if energy is not None and basis_amount and reference_amount and basis_unit == reference_unit:
            reference_kcal = round(energy * reference_amount / basis_amount, 2)
        output.append({
            "food_code": clean(row[index["식품코드"]]),
            "name": name,
            "name_key": name_key,
            "category": clean(row[index["식품대분류명"]]),
            "energy_kcal": energy,
            "basis_amount": basis_amount,
            "basis_unit": basis_unit,
            "reference_amount": reference_amount,
            "reference_unit": reference_unit or "",
            "reference_kcal": reference_kcal,
            "protein_g": number(row[index["단백질\n(g)"]]),
            "fat_g": number(row[index["지방\n(g)"]]),
            "carbohydrate_g": number(row[index["탄수화물\n(g)"]]),
            "sugars_g": number(row[index["당류\n(g)"]]),
            "fiber_g": number(row[index["식이섬유\n(g)"]]),
            "sodium_mg": number(row[index["나트륨\n(mg)"]]),
            "source": clean(row[index["출처명"]]),
            "source_kind": "supplement_dbx",
            "source_created_at": iso_date(row[index["데이터생성일자"]]),
            "source_reference_date": "",
        })
        existing_keys.add(name_key)
    return output


primary = load_primary()
primary_keys = {row["name_key"] for row in primary}
supplement = load_supplement(primary_keys)
combined = primary + supplement

columns = [
    "food_code", "name", "category", "energy_kcal", "basis_amount", "basis_unit",
    "reference_amount", "reference_unit", "reference_kcal", "protein_g", "fat_g",
    "carbohydrate_g", "sugars_g", "fiber_g", "sodium_mg", "source", "source_kind",
    "source_created_at", "source_reference_date",
]

with (OUT_DIR / "food-nutrition-master.csv").open("w", encoding="utf-8-sig", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=columns)
    writer.writeheader()
    writer.writerows({key: row.get(key) for key in columns} for row in combined)

manifest = {
    "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
    "primary_rows_after_code_dedup": len(primary),
    "supplement_rows_added_by_name": len(supplement),
    "combined_rows": len(combined),
    "basis_units": dict(Counter(row["basis_unit"] or "unknown" for row in combined)),
    "source_kinds": dict(Counter(row["source_kind"] for row in combined)),
    "reference_kcal_rows": sum(row["reference_kcal"] is not None for row in combined),
    "missing_energy_rows": sum(row["energy_kcal"] is None for row in combined),
    "notes": [
        "db1.csv is the primary dataset; db.xlsx contributes names absent from db1.csv.",
        "Energy remains tied to basis_amount/basis_unit; no implicit serving conversion is applied.",
        "Review and approve before importing into Supabase or replacing the app catalog.",
    ],
}
with (OUT_DIR / "food-nutrition-master.manifest.json").open("w", encoding="utf-8") as handle:
    json.dump(manifest, handle, ensure_ascii=False, indent=2)
print(json.dumps(manifest, ensure_ascii=False, indent=2))
