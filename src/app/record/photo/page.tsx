"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { MealForm } from "@/components/MealForm";
import { AppIcon } from "@/components/AppIcon";
import { PageHero } from "@/components/PageHero";

export default function PhotoRecordPage() {
  const [preview, setPreview] = useState("");
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 선택할 수 있어요.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("8MB 이하 이미지를 선택해 주세요.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setError("");
    setImageName(file.name);
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setImageName("");
  }

  return (
    <main className="shell photo-record-page">
      <Header title="사진 입력" backHref="/record" />
      <PageHero
        eyebrow="사진 기록"
        title="음식 사진을 올려주세요"
        description="사진을 보며 음식 이름을 검색하고 섭취량을 입력해요."
        icon="camera"
        imageSrc="/images/ui/clay-camera.png"
        tone="sky"
        compact
      />

      <section className={`upload-box ${preview ? "has-image" : ""}`}>
        {preview ? (
          <>
            <Image src={preview} alt="선택한 음식 사진 미리보기" fill unoptimized />
            <button className="remove-image" type="button" onClick={clearImage}>
              다시 선택
            </button>
          </>
        ) : (
          <>
            <span className="upload-icon"><Image src="/images/ui/clay-camera.png" alt="" width={56} height={56} priority /></span>
            <strong>사진을 여기에 담아주세요</strong>
            <span>JPG, PNG, WEBP · 최대 8MB</span>
            <label className="upload-button">
              카메라 또는 갤러리
              <input type="file" accept="image/*" capture="environment" onChange={chooseImage} />
            </label>
          </>
        )}
      </section>
      {!preview && (
        <p className="flow-note"><AppIcon name="sparkles" size={17} /> 사진은 이 기기에만 임시로 표시되며, 저장 전 음식 정보를 직접 확인해요.</p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {preview ? (
        <MealForm inputType="photo" imageName={imageName} />
      ) : (
        <button className="primary-button" disabled>
          사진을 먼저 선택해 주세요
        </button>
      )}
    </main>
  );
}
