import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const sourcePath = resolve(process.cwd(), "data", "cal.csv");
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

const source = new TextDecoder("euc-kr")
  .decode(readFileSync(sourcePath))
  .replace(/^\uFEFF/, "");
const [headerLine, ...dataLines] = source.split(/\r?\n/);

if (!headerLine) {
  throw new Error("칼로리 CSV 헤더를 찾지 못했습니다.");
}

const headers = parseCsvLine(headerLine);
const nameIndex = headers.indexOf("음식명");
const caloriesIndex = headers.indexOf("1인분칼로리(kcal)");

if (nameIndex < 0 || caloriesIndex < 0) {
  throw new Error("칼로리 CSV의 필수 열을 찾지 못했습니다.");
}

const catalog = dataLines
  .filter((line) => line.trim())
  .map((line, index) => {
    const values = parseCsvLine(line);
    const name = values[nameIndex]?.trim();
    const calories = Number.parseFloat(values[caloriesIndex] ?? "");

    if (!name || !Number.isFinite(calories) || calories < 0) {
      throw new Error(`칼로리 CSV ${index + 2}행의 값이 올바르지 않습니다.`);
    }

    return { name, calories };
  });

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`칼로리 정보 ${catalog.length}건을 생성했습니다.`);
