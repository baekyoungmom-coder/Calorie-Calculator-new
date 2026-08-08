import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { findCalorieFood, searchCalorieFoods } from "@/lib/meals";

const DEFAULT_MODEL = "Qwen/Qwen2.5-VL-3B-Instruct";
const MAX_DATA_URL_LENGTH = 1_500_000;

function extractCandidates(value: string) {
  const cleaned = value.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item : item?.name))
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6);
      }
    } catch {
      // 모델이 JSON을 완성하지 못한 경우 일반 텍스트에서 계속 시도한다.
    }
  }

  return cleaned
    .split(/[\n,،]/)
    .map((item) => item.replace(/^[-*\d.)]+\s*/, "").trim())
    .filter((item) => item.length > 1 && item.length < 60)
    .slice(0, 6);
}

export async function POST(request: NextRequest) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return failure(
      "사진 인식 모델이 아직 연결되지 않았습니다. 음식 이름을 직접 검색해 주세요.",
      "PHOTO_VISION_NOT_CONFIGURED",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("사진 분석 요청 형식이 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  const imageDataUrl =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).imageDataUrl
      : null;
  if (
    typeof imageDataUrl !== "string" ||
    imageDataUrl.length > MAX_DATA_URL_LENGTH ||
    !/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(imageDataUrl)
  ) {
    return failure("분석할 이미지가 없거나 너무 큽니다.", "VALIDATION_ERROR", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.HF_VISION_MODEL || DEFAULT_MODEL,
        temperature: 0.1,
        max_tokens: 180,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "이 음식 사진에서 보이는 음식 이름을 최대 6개까지 한국어로 추려 주세요. 음식 이름만 JSON 배열로 답하고, 칼로리나 양은 추정하지 마세요.",
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return failure("사진 인식 서비스가 잠시 응답하지 않습니다. 음식 이름을 직접 입력해 주세요.", "PHOTO_VISION_UNAVAILABLE", 502);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content || "";
    const candidates = extractCandidates(text);
    const items = candidates.map((name) => {
      const exact = findCalorieFood(name);
      const match = exact || searchCalorieFoods(name, 1)[0];
      return {
        name,
        matchedFoodName: match?.name || null,
        calories: match ? Math.round(match.calories) : null,
      };
    });

    return success({
      items,
      note: items.length
        ? "사진 인식 결과는 추정 후보입니다. 음식과 양을 확인한 뒤 저장해 주세요."
        : "사진에서 음식 후보를 찾지 못했습니다. 음식 이름을 직접 검색해 주세요.",
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "사진 인식 시간이 초과되었습니다. 음식 이름을 직접 검색해 주세요."
      : "사진 인식 중 오류가 발생했습니다. 음식 이름을 직접 검색해 주세요.";
    return failure(message, "PHOTO_VISION_ERROR", 502);
  } finally {
    clearTimeout(timeout);
  }
}
