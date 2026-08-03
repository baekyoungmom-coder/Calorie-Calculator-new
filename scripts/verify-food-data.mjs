import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const sourcePath = resolve(
  process.cwd(),
  "data",
  "source",
  "official-raw-foods.csv",
);
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

function parseBasisGrams(value) {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*g$/i);
  return match ? Number.parseFloat(match[1]) : null;
}

const [headerLine, ...lines] = source.split(/\r?\n/);
const headers = parseCsvLine(headerLine ?? "");
const codeIndex = headers.indexOf("식품코드");
const energyIndex = headers.indexOf("에너지(kcal)");
const basisIndex = headers.indexOf("영양성분함량기준량");
if ([codeIndex, energyIndex, basisIndex].some((index) => index < 0)) {
  throw new Error("공식 원재료성 식품 CSV의 필수 열을 찾지 못했습니다.");
}

const expectedCodes = lines.flatMap((line) => {
  if (!line.trim()) return [];
  const values = parseCsvLine(line);
  const code = values[codeIndex]?.trim();
  const energy = Number.parseFloat(values[energyIndex] ?? "");
  const basis = parseBasisGrams(values[basisIndex] ?? "");
  const nameIndex = headers.indexOf("식품명");
  const name = values[nameIndex]?.trim().replace(/_/g, " ").replace(/\s+/g, " ");
  const normalizedName = name
    ?.normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/gi, "");
  return code && normalizedName && Number.isFinite(energy) && energy >= 0 && basis && basis > 0
    ? [`${code}:${normalizedName}`]
    : [];
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SECRET_KEY 환경변수가 필요합니다.");
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });
const { count, error: countError } = await supabase
  .from("foods")
  .select("id", { count: "exact", head: true })
  .eq("food_type", "raw")
  .eq("is_active", true);
if (countError) throw new Error(`foods 건수를 확인하지 못했습니다: ${countError.message}`);

const sampleRecordKeys = expectedCodes.slice(0, 10);
const { data: samples, error: sampleError } = await supabase
  .from("foods")
  .select("source_record_key, energy_kcal, basis_grams")
  .in("source_record_key", sampleRecordKeys);
if (sampleError) throw new Error(`foods 표본을 확인하지 못했습니다: ${sampleError.message}`);

if (count !== expectedCodes.length || samples?.length !== sampleRecordKeys.length) {
  throw new Error(`동기화 검증 실패: 예상 ${expectedCodes.length}건, DB ${count ?? 0}건, 표본 ${samples?.length ?? 0}/${sampleRecordKeys.length}건`);
}

console.log(`foods 검증 완료: 원재료성 식품 ${count}건, 식품코드·기준량·에너지 표본 ${samples.length}건이 일치합니다.`);
