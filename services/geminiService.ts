import { GoogleGenerativeAI } from "@google/generative-ai";

// Fix: Updated service to follow guidelines for initialization and direct API usage
export const generateGameCommentary = async (score: number, highScore: number): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey) {
            return "API key not configured. Set VITE_GEMINI_API_KEY in your environment.";
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const isNewHigh = score >= highScore && score > 0;

        const prompt = `
      I just finished a round of a difficult infinite runner game called "Neon Slope".
      My score: ${score}.
      My all-time high score: ${highScore}.
      Is new high score: ${isNewHigh}.
      
      Act as a futuristic, slightly snarky but encouraging robot sports commentator. 
      Give me a ONE sentence reaction to my performance. 
      If it's a low score (under 50), roast me gently. 
      If it's high (over 100), praise me.
      If it's a new high score, celebrate wildly.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "Connection terminated. Try again runner.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Communication systems offline.";
    }
};
