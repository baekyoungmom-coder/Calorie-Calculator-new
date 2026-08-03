import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const legacySourcePath = resolve(process.cwd(), "data", "cal.csv");
const officialRawSourcePath = resolve(
  process.cwd(),
  "data",
  "source",
  "official-raw-foods.csv",
);
const outputPath = resolve(
  process.cwd(),
  "src",
  "generated",
  "calorie-catalog.json",
);

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
      continue;
    }

    if (character === "," && !quoted) {
      values.push(value);
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
}

function parseSource(filePath) {
  return new TextDecoder("euc-kr")
    .decode(readFileSync(filePath))
    .replace(/^\uFEFF/, "");
}

function normalizeFoodName(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/gi, "");
}

const legacySource = parseSource(legacySourcePath)
  .replace(/^\uFEFF/, "");
const [headerLine, ...dataLines] = legacySource.split(/\r?\n/);

if (!headerLine) {
  throw new Error("칼로리 CSV 헤더를 찾지 못했습니다.");
}

const headers = parseCsvLine(headerLine);
const nameIndex = headers.indexOf("음식명");
const caloriesIndex = headers.indexOf("1인분칼로리(kcal)");

if (nameIndex < 0 || caloriesIndex < 0) {
  throw new Error("칼로리 CSV의 필수 열을 찾지 못했습니다.");
}

const legacyCatalog = dataLines
  .filter((line) => line.trim())
  .map((line, index) => {
    const values = parseCsvLine(line);
    const name = values[nameIndex]?.trim();
    const calories = Number.parseFloat(values[caloriesIndex] ?? "");

    if (!name || !Number.isFinite(calories) || calories < 0) {
      throw new Error(`칼로리 CSV ${index + 2}행의 값이 올바르지 않습니다.`);
    }

    return { name, calories, source: "legacy-serving" };
  });

const officialSource = parseSource(officialRawSourcePath);
const [officialHeaderLine, ...officialDataLines] = officialSource.split(/\r?\n/);
const officialHeaders = parseCsvLine(officialHeaderLine ?? "");
const officialIndexes = Object.fromEntries(
  ["식품코드", "식품명", "에너지(kcal)", "영양성분함량기준량", "출처명", "데이터기준일자"].map(
    (header) => [header, officialHeaders.indexOf(header)],
  ),
);

if (Object.values(officialIndexes).some((index) => index < 0)) {
  throw new Error("공식 원재료성 식품 CSV의 필수 열을 찾지 못했습니다.");
}

function parseBasisGrams(value) {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*g$/i);
  if (!match) return null;

  const grams = Number.parseFloat(match[1]);
  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

let skippedOfficialRows = 0;
const officialCatalog = officialDataLines
  .filter((line) => line.trim())
  .flatMap((line) => {
    const values = parseCsvLine(line);
    const id = values[officialIndexes["식품코드"]]?.trim();
    const sourceName = values[officialIndexes["식품명"]]?.trim();
    const calories = Number.parseFloat(values[officialIndexes["에너지(kcal)"]] ?? "");
    const basisGrams = parseBasisGrams(
      values[officialIndexes["영양성분함량기준량"]] ?? "",
    );

    if (!id || !sourceName || !Number.isFinite(calories) || calories < 0 || !basisGrams) {
      skippedOfficialRows += 1;
      return [];
    }

    return [{
      id: `official:${id}`,
      name: sourceName.replace(/_/g, " ").replace(/\s+/g, " ").trim(),
      calories,
      basisGrams,
      source: values[officialIndexes["출처명"]]?.trim() || "공식 식품영양성분 DB",
      sourceCode: id,
      sourceUpdatedAt: values[officialIndexes["데이터기준일자"]]?.trim() || null,
    }];
  });

const officialPrefixes = officialCatalog.map((entry) => normalizeFoodName(entry.name));
const catalog = [
  ...officialCatalog,
  ...legacyCatalog.filter(
    (entry) =>
      !officialPrefixes.some((officialName) =>
        officialName.startsWith(normalizeFoodName(entry.name)),
      ),
  ),
];

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`칼로리 정보 ${catalog.length}건을 생성했습니다. (공식 원재료성 식품 ${officialCatalog.length}건 포함, 기준량 또는 에너지가 없는 ${skippedOfficialRows}건 제외)`);
