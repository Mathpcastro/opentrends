import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Only initialize if key is present to avoid crashes
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // For MVP client-side implementation. In prod, use backend proxy.
}) : null;

export const generateBrazilAdaptation = async (productName: string, productDescription: string) => {
  if (!openai) {
    return "Integração OpenAI não configurada. Adicione sua chave API no arquivo .env.";
  }

  try {
    const prompt = `
      Analise o SaaS "${productName}": "${productDescription}".
      Sugira como adaptar este produto para o mercado brasileiro.
      Considere:
      1. Necessidades específicas do Brasil.
      2. Concorrentes locais (se houver).
      3. Sugestão de monetização no Brasil.
      
      Responda em formato de tópicos curtos e diretos. Tom profissional e estratégico.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Não foi possível gerar sugestões.";
  } catch (error) {
    console.error("Error generating OpenAI response:", error);
    return "Erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};

