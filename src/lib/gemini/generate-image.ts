import { getGenAI } from "./client";
import sharp from "sharp";

export interface GenerateImageOptions {
  width: number;
  height: number;
  quality?: number; // WebP quality, default 85
}

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions
): Promise<Buffer> {
  const genai = getGenAI();
  const response = await genai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: { numberOfImages: 1 },
  });

  const base64 = response.generatedImages?.[0]?.image?.imageBytes;
  if (!base64) throw new Error("No image generated");

  const buffer = Buffer.from(base64, "base64");

  return sharp(buffer)
    .resize(options.width, options.height, { fit: "cover" })
    .webp({ quality: options.quality ?? 85 })
    .toBuffer();
}
