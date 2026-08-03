import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const sourcePath = resolve(
  process.cwd(),
  "data",
  "source",
  "official-raw-foods.csv",
);
const dryRun = process.argv.includes("--dry-run");
const source = new TextDecoder("euc-kr")
  .decode(readFileSync(sourcePath))
  .replace(/^\uFEFF/, "");

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

function normalizeFoodName(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/gi, "");
}

function parseBasisGrams(value) {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*g$/i);
  if (!match) return null;
  const grams = Number.parseFloat(match[1]);
  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

const [headerLine, ...lines] = source.split(/\r?\n/);
const headers = parseCsvLine(headerLine ?? "");
const indexes = Object.fromEntries(
  ["식품코드", "식품명", "에너지(kcal)", "영양성분함량기준량", "출처명", "데이터기준일자"].map(
    (header) => [header, headers.indexOf(header)],
  ),
);

if (Object.values(indexes).some((index) => index < 0)) {
  throw new Error("공식 원재료성 식품 CSV의 필수 열을 찾지 못했습니다.");
}

const foods = lines.flatMap((line) => {
  if (!line.trim()) return [];
  const values = parseCsvLine(line);
  const sourceFoodCode = values[indexes["식품코드"]]?.trim();
  const name = values[indexes["식품명"]]?.trim().replace(/_/g, " ").replace(/\s+/g, " ");
  const energyKcal = Number.parseFloat(values[indexes["에너지(kcal)"]] ?? "");
  const basisGrams = parseBasisGrams(values[indexes["영양성분함량기준량"]] ?? "");

  if (!sourceFoodCode || !name || !Number.isFinite(energyKcal) || energyKcal < 0 || !basisGrams) {
    return [];
  }

  return [{
    source_name: values[indexes["출처명"]]?.trim() || "공식 식품영양성분 DB",
    source_food_code: sourceFoodCode,
    name,
    normalized_name: normalizeFoodName(name),
    source_record_key: `${sourceFoodCode}:${normalizeFoodName(name)}`,
    food_type: "raw",
    energy_kcal: energyKcal,
    basis_grams: basisGrams,
    source_updated_at: values[indexes["데이터기준일자"]]?.trim() || null,
    is_active: true,
    synced_at: new Date().toISOString(),
  }];
});

const duplicateSourceCodes = foods.length - new Set(
  foods.map((food) => food.source_food_code),
).size;
const duplicateRecordKeys = foods.length - new Set(
  foods.map((food) => food.source_record_key),
).size;
if (duplicateRecordKeys > 0) {
  throw new Error(`중복된 공식 식품 레코드 키 ${duplicateRecordKeys}건을 발견했습니다.`);
}

if (dryRun) {
  const basisValues = new Set(foods.map((food) => food.basis_grams));
  const sourceNames = new Set(foods.map((food) => food.source_name));
  console.log(
    JSON.stringify(
      {
        validFoods: foods.length,
        skippedRows: lines.filter((line) => line.trim()).length - foods.length,
        duplicateSourceCodes,
        duplicateRecordKeys,
        basisGrams: [...basisValues].sort((left, right) => left - right),
        sourceCount: sourceNames.size,
        status: "validated_without_database_write",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SECRET_KEY 환경변수가 필요합니다.");
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });
for (let index = 0; index < foods.length; index += 500) {
  const { error } = await supabase
    .from("foods")
    .upsert(foods.slice(index, index + 500), { onConflict: "source_record_key" });
  if (error) throw new Error(`foods 동기화에 실패했습니다: ${error.message}`);
}

console.log(`공식 원재료성 식품 ${foods.length}건을 foods 테이블에 동기화했습니다.`);
