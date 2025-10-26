const Groq = require('groq-sdk');

const groqApiKey = process.env.GROQ_API_KEY;

const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

function ensureGroqClient() {
  if (!groqClient) {
    throw new Error('Groq API no está configurado. Define GROQ_API_KEY en el entorno.');
  }
  return groqClient;
}

module.exports = {
  ensureGroqClient,
};
