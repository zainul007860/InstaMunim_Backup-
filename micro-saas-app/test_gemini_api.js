// Test Gemini call using standard global fetch
async function test() {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const restaurantName = 'Zainul Mobile';
  const businessType = 'Mobile/Electronics';
  const offerTitle = 'Sunday offer';
  const discountDetails = '10% Discount on all Electronic Devices';
  const productName = 'All Products';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert AI image prompt engineer for advertising banners.
Write a highly descriptive, visually rich, and professional image generation prompt (for Midjourney or Stable Diffusion) to create a premium social media advertisement poster banner.

Details of the offer:
- Business Name: "${restaurantName}" (a mobile & electronics store)
- Offer Title: "${offerTitle}"
- Discount/Promo Deal: "${discountDetails} on ${productName}"

Requirements for the generated prompt:
1. Make it extremely visual, describing the background, lighting, colors, and premium commercial photography style.
2. Ensure the text details "${restaurantName}", "${offerTitle}", and "${discountDetails} on ${productName}" are prominently featured in the design as clean, bold typography.
3. Keep it under 150 words.
4. Return ONLY the final raw prompt string. Do not include markdown code block syntax, quotes, preamble, or explanations.`
                }
              ]
            }
          ]
        })
      }
    );

    const geminiData = await response.json();
    console.log("Raw Gemini Response Candidates:", JSON.stringify(geminiData, null, 2));
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Extracted Text:", rawText);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
