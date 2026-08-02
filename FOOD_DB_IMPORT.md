# 영양 DB 반영 안내

## 생성된 통합 파일

`data/food-nutrition-master.csv`는 다음 순서로 만들어졌습니다.

- `db1.csv`: 최신 주 데이터. 식품코드별 최신 행만 유지
- `db.xlsx`: 주 데이터에 없는 식품명 650건만 보완 추가
- 에너지는 원본 기준량(`100g` 또는 `100ml`)을 유지
- 참고 섭취량이 확인되는 항목만 `reference_kcal`을 계산

## Supabase 반영 순서

1. `supabase/migrations/20260802090000_create_food_nutrition_master.sql`을 SQL Editor에서 한 번 실행합니다.
2. Table Editor에서 `food_nutrition_master`를 선택합니다.
3. `data/food-nutrition-master.csv`를 CSV Import로 업로드합니다.
4. `food_code`가 Primary/Unique 기준으로 매핑되는지 확인합니다.
5. 샘플 식품명을 검색해 `name`, `energy_kcal`, `basis_unit`이 올바른지 확인합니다.

기존 `profiles`, `meal_records`, `calorie_estimates` 테이블과 기존 마이그레이션은 변경하지 않습니다.
영양 마스터 테이블은 서버 전용 `SUPABASE_SECRET_KEY`를 사용하는 API에서만 조회하도록 RLS를 잠갔습니다.
