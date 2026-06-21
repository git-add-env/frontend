import { apiClient } from "@/lib/api/api-client"

export type ImageUploadPresign = {
  uploadUrl: string
  imageUrl: string
}

export function requestImageUploadPresign(fileName: string, fileType: string) {
  return apiClient<ImageUploadPresign>("/api/uploads/images", {
    method: "POST",
    body: JSON.stringify({ fileName, fileType }),
  })
}

export async function uploadImage(file: File): Promise<string> {
  const { uploadUrl, imageUrl } = await requestImageUploadPresign(file.name, file.type)

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })

  if (!response.ok) {
    throw new Error("이미지 업로드에 실패했습니다. 다시 시도해주세요.")
  }

  return imageUrl
}
