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

export interface TranslatedContent {
  name: string;
  tagline: string;
  description: string;
}

export const translateToPortuguese = async (
  name: string,
  tagline: string,
  description: string
): Promise<TranslatedContent> => {
  if (!openai) {
    return { name, tagline, description }; // Retorna original se não houver OpenAI
  }

  try {
    const prompt = `
Traduza o seguinte conteúdo de um produto SaaS do inglês para português brasileiro (pt-BR).
Mantenha o tom profissional e técnico. Preserve nomes próprios, marcas e termos técnicos quando apropriado.

Nome do produto: "${name}"
Tagline: "${tagline}"
Descrição: "${description}"

Responda APENAS com um JSON válido no seguinte formato:
{
  "name": "nome traduzido",
  "tagline": "tagline traduzida",
  "description": "descrição traduzida"
}

Não adicione texto adicional, apenas o JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const translated = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: translated.name || name,
      tagline: translated.tagline || tagline,
      description: translated.description || description,
    };
  } catch (error) {
    console.error("Error translating content:", error);
    return { name, tagline, description }; // Retorna original em caso de erro
  }
};

