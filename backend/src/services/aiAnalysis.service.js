const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const analyzeFeedbackText = async (feedbackText) => {
    if (!feedbackText || !feedbackText.trim()) {
        throw new Error("Feedback text is required");
    }

    const prompt = `
You are an AI assistant for a Course Feedback System.

Analyze the following anonymous student feedback.

IMPORTANT:
- Do not identify or guess the student's identity.
- Analyze only the provided feedback text.
- Do not invent facts.
- Return ONLY valid JSON.
- Keep the analysis concise and useful for course administrators.

Required JSON structure:
{
  "sentiment": "Positive | Neutral | Negative | Mixed",
  "topics": [],
  "issues": [],
  "summary": "",
  "suggestions": []
}

Feedback:
${feedbackText}
`;

    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL,
        input: prompt
    });

    const output = response.output_text;

    if (!output) {
        throw new Error("AI returned an empty response");
    }

    try {
        return JSON.parse(output);
    } catch (error) {
        return {
            sentiment: "Neutral",
            topics: [],
            issues: [],
            summary: output,
            suggestions: []
        };
    }
};

module.exports = {
    analyzeFeedbackText
};