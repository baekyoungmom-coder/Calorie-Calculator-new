# Photo-assisted calorie estimation

The default photo flow has no external AI cost:

1. The browser keeps the selected image only as a temporary visual reference.
2. The user confirms the food name while looking at the photo.
3. The public nutrition DB finds the food's calorie basis and the user enters the eaten amount.
4. The normal result and save flow records the calculated estimate.

The optional `/api/photo-estimate` Hugging Face route remains available for future experiments, but it is not called by the standard photo-record screen.

## Environment

Set these server-side variables in local `.env.local` and in the Vercel project only when enabling recognition:

```text
HF_TOKEN=
HF_VISION_MODEL=Qwen/Qwen2.5-VL-3B-Instruct
```

`HF_TOKEN` is never exposed to the browser. The original photo and model response are not stored.

Recognition is an estimate, not a medical or nutritional guarantee. The user must review the candidate, serving amount, and final calories before saving.
