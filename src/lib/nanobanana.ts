export async function generateGooglyImage(
  objectName: string,
  imageBase64: string
): Promise<Buffer> {
  const response = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: `data:image/jpeg;base64,${imageBase64}`,
      prompt: `Add two large cartoon googly eyes and a small cute cartoon mouth to this ${objectName}. Keep the object recognizable. Fun, whimsical, kawaii style. White clean background.`,
      strength: 0.65,
      num_inference_steps: 28,
      guidance_scale: 3.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`fal.ai image generation failed: ${error}`);
  }

  const data = await response.json();
  const imageUrl = data.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image returned from fal.ai");
  }

  // Download the generated image
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
