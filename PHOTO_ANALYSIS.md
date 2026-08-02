# Photo calorie estimation

The photo flow is intentionally a two-step estimate:

1. The browser keeps the selected image temporarily and creates a resized JPEG data URL for analysis.
2. `POST /api/photo-estimate` sends that temporary image to the optional Hugging Face Inference Providers vision model.
3. The model returns food-name candidates only. The app matches candidates against the local calorie catalog.
4. The user confirms the food and serving amount in the existing `MealForm`; the normal result and save flow is reused.

## Environment

Set these server-side variables in local `.env.local` and in the Vercel project only when enabling recognition:

```text
HF_TOKEN=
HF_VISION_MODEL=Qwen/Qwen2.5-VL-3B-Instruct
```

`HF_TOKEN` is never exposed to the browser. If it is missing or the provider is unavailable, the page shows a clear message and remains usable with the existing local search/manual calorie entry. The original photo and model response are not stored.

Recognition is an estimate, not a medical or nutritional guarantee. The user must review the candidate, serving amount, and final calories before saving.
