
const OpenAI = require("openai");

const isDemoMode = () =>
    String(process.env.DEMO_MODE).toLowerCase() === "true";

const analyzeDemoFeedback = (feedbackText) => {
    const text = feedbackText.toLowerCase();

    const positiveWords = [
        "good", "great", "excellent", "helpful", "clear",
        "well", "easy", "improved", "useful", "best",
        "understand", "supportive", "enjoyed", "amazing"
    ];

    const negativeWords = [
        "bad", "poor", "difficult", "confusing", "unclear",
        "short", "slow", "late", "problem", "issue",
        "lack", "limited", "not enough", "improve",
        "worst", "disappointed", "hard"
    ];

    const countMatches = (words) =>
        words.reduce((count, word) => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`\\b${escaped}\\b`, "g");
            return count + (text.match(regex) || []).length;
        }, 0);

    const positiveCount = countMatches(positiveWords);
    const negativeCount = countMatches(negativeWords);

    let sentiment = "Neutral";

    if (positiveCount > 0 && negativeCount > 0) {
        sentiment = "Mixed";
    } else if (positiveCount > negativeCount) {
        sentiment = "Positive";
    } else if (negativeCount > positiveCount) {
        sentiment = "Negative";
    }

    const topicRules = [
        {
            name: "Teaching Quality",
            words: ["instructor", "teacher", "teaching", "explain", "lecture"]
        },
        {
            name: "Practical Labs",
            words: ["lab", "practical", "hands-on", "exercise"]
        },
        {
            name: "Course Content",
            words: ["course", "content", "syllabus", "topic", "lesson"]
        },
        {
            name: "Learning Materials",
            words: ["material", "notes", "slides", "resources"]
        },
        {
            name: "Time Management",
            words: ["time", "schedule", "duration", "late", "short"]
        },
        {
            name: "Facilities",
            words: ["facility", "classroom", "computer", "equipment", "internet"]
        },
        {
            name: "Communication",
            words: ["communication", "feedback", "support", "response"]
        }
    ];

    const topics = topicRules
        .filter(topic =>
            topic.words.some(word => text.includes(word))
        )
        .map(topic => topic.name);

    const issueRules = [
        {
            words: ["short", "not enough", "limited", "lack"],
            issue: "Insufficient time or resources may need attention."
        },
        {
            words: ["confusing", "unclear", "difficult", "hard"],
            issue: "Some course explanations or topics may need clarification."
        },
        {
            words: ["slow", "late", "delay"],
            issue: "Timeliness may need improvement."
        },
        {
            words: ["poor", "bad", "problem", "issue", "worst"],
            issue: "The reported experience may need further review."
        }
    ];

    const issues = issueRules
        .filter(rule => rule.words.some(word => text.includes(word)))
        .map(rule => rule.issue);

    const suggestions = [];

    if (/\b(lab|practical|hands-on|exercise)\b/.test(text)) {
        suggestions.push(
            "Review practical activities and provide sufficient hands-on practice."
        );
    }

    if (/\b(confusing|unclear|difficult|hard)\b/.test(text)) {
        suggestions.push(
            "Consider clearer explanations and additional learning examples."
        );
    }

    if (/\b(short|time|duration|schedule|late)\b/.test(text)) {
        suggestions.push(
            "Review course timing and allocate time according to learning needs."
        );
    }

    if (/\b(material|notes|slides|resources)\b/.test(text)) {
        suggestions.push(
            "Review learning materials and make relevant resources accessible."
        );
    }

    if (suggestions.length === 0 && sentiment === "Negative") {
        suggestions.push(
            "Review the feedback and investigate the reported concerns."
        );
    }

    if (sentiment === "Positive") {
        suggestions.push(
            "Maintain the practices that students have appreciated."
        );
    }

    if (topics.length === 0) {
        topics.push("General Course Feedback");
    }

    return {
        sentiment,
        topics,
        issues,
        summary:
            "Demo-mode analysis based on predefined keywords. " +
            "Review the original feedback before making decisions.",
        suggestions
    };
};

const analyzeFeedbackText = async (feedbackText) => {
    if (
        typeof feedbackText !== "string" ||
        !feedbackText.trim()
    ) {
        throw new Error("Feedback text is required");
    }

    // No OpenAI API request is made in demo mode.
    if (isDemoMode()) {
        return analyzeDemoFeedback(feedbackText);
    }

    // Real AI mode, used when demo mode is disabled.
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
    }

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
You are an assistant for a Course Feedback System.

Analyze the anonymous student feedback below.
Do not identify the student or invent facts.
Return only valid JSON using this structure:
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
        const analysis = JSON.parse(output);

        if (
            !["Positive", "Neutral", "Negative", "Mixed"]
                .includes(analysis.sentiment) ||
            !Array.isArray(analysis.topics) ||
            !Array.isArray(analysis.issues) ||
            typeof analysis.summary !== "string" ||
            !Array.isArray(analysis.suggestions)
        ) {
            throw new Error("Invalid analysis structure");
        }

        return analysis;
    } catch (error) {
        throw new Error("AI returned invalid JSON analysis");
    }
};

module.exports = {
    analyzeFeedbackText
};
