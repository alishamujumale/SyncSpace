const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const generateProjectPlan = async (idea) => {
  try {
    const prompt = `
You are an expert project manager and software architect.
A user wants to build: "${idea}"

Generate a detailed project plan in the following JSON format only, no extra text, no markdown:
{
  "projectName": "string",
  "summary": "string",
  "features": ["feature1", "feature2"],
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "deadline": 7,
      "suggestedRole": "string"
    }
  ],
  "suggestedRoles": ["role1", "role2"],
  "timeline": "string"
}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const text = response.choices[0].message.content;
    console.log('AI raw response:', text);

    // Clean response in case model adds markdown
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Groq error:', error.message);
    throw error;
  }
};

const askAssistant = async (question, context) => {
  try {
    const prompt = `
You are a helpful project management assistant for SyncSpace.

Current project context:
${context}

User question: "${question}"

Give a short, helpful, direct answer in plain text.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Groq error:', error.message);
    throw error;
  }
};

const summarizeChat = async (messages) => {
  try {
    const chatText = messages
      .map(m => `${m.sender.name}: ${m.text}`)
      .join('\n');

    const prompt = `
Summarize this team chat in 3-4 bullet points.
Focus on decisions made and action items:

${chatText}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Groq error:', error.message);
    throw error;
  }
};

module.exports = { generateProjectPlan, askAssistant, summarizeChat };