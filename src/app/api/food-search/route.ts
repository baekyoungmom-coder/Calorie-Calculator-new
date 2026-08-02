import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchCalorieFoods } from "@/lib/meals";

const MAX_RESULTS = 8;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 1) {
    return NextResponse.json({ success: true, data: { items: [] } });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({
      success: true,
      data: { items: searchCalorieFoods(query, MAX_RESULTS), source: "local" },
    });
  }

  const { data, error } = await admin
    .from("food_nutrition_master")
    .select("food_code,name,energy_kcal,reference_kcal,basis_amount,basis_unit,reference_amount,reference_unit,source")
    .ilike("name", `%${query.replace(/[%_]/g, "\\$&")}%`)
    .order("name")
    .limit(MAX_RESULTS);

  if (error) {
    return NextResponse.json({
      success: true,
      data: { items: searchCalorieFoods(query, MAX_RESULTS), source: "local-fallback" },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      source: "food_nutrition_master",
      items: (data ?? []).map((item) => ({
        name: item.name,
        calories: item.reference_kcal ?? item.energy_kcal,
        basisAmount: item.reference_amount ?? item.basis_amount,
        basisUnit: item.reference_unit || item.basis_unit,
        source: item.source,
        foodCode: item.food_code,
      })),
    },
  });
}
