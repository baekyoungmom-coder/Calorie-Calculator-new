"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { MealForm } from "@/components/MealForm";

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
    setImageName(file.name);
    setError("");
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setImageName("");
  }

  return (
    <main className="shell">
      <Header title="사진 입력" backHref="/record" />
      <section className="page-intro compact">
        <p className="eyebrow">사진 기록</p>
        <h1>음식 사진을 올려주세요</h1>
        <p>사진을 첨부한 뒤 음식 목록과 인분 수를 선택해 주세요.</p>
      </section>

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
            <span className="upload-icon" aria-hidden="true">＋</span>
            <strong>사진을 선택하세요</strong>
            <span>JPG, PNG, WEBP · 최대 8MB</span>
            <label className="upload-button">
              카메라 또는 갤러리
              <input type="file" accept="image/*" capture="environment" onChange={chooseImage} />
            </label>
          </>
        )}
      </section>
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
