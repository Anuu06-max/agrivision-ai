import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to analyze a crop image." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server setup incomplete: GEMINI_API_KEY is missing in Vercel Environment Variables." });
    }

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Please select a crop image." });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return res.status(400).json({ error: "Please upload a JPG, PNG, or WebP image." });
    }
    if (imageBase64.length > 7_000_000) {
      return res.status(413).json({ error: "Image is too large. Please use an image smaller than 5 MB." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an agricultural assistant. Analyze the crop image carefully.
Give a useful report with these headings:
1. Visible symptoms
2. Possible disease, pest, or nutrient issue
3. Confidence (low, medium, or high)
4. Recommended next steps
5. Prevention tips
Use simple English. Be explicit about uncertainty and do not claim a definite diagnosis from an image alone. Recommend confirmation from a local agricultural expert before pesticide or chemical treatment. If the image is not a crop/plant, say so clearly.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      }]
    });

    return res.status(200).json({
      success: true,
      report: result.text || "No report was returned. Please try again."
    });
  } catch (error) {
    console.error("Crop Doctor API error:", error?.message || error);
    return res.status(500).json({ error: "Crop analysis failed. Check the Gemini API key, quota, and Vercel function logs." });
  }
}