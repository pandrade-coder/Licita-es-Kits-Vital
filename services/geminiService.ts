
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DataService } from "./dataService";
import { Bid, BidStatus, BidModality } from "../types";

const KITS_VITAL_CONTEXT = `
DADOS MESTRE DA KITS VITAL:
- Razão Social: Kits Vital Comercio de Produtos Para Saude, Tatico e Emergencia Ltda.
- CNPJ: 42.394.438/0001-41
- Inscrição Estadual: 16.402.085-3
- Endereço: Avenida Dom Pedro II, 531, Sala 120, Centro, João Pessoa - PB, CEP: 58013-420
PRODUTOS TÁTICOS: Torniquetes, bandagens israelenses, gazes táticas, gase hemostática, tesoura ponta romba, kits APH.
`;

const functionTools = {
  functionDeclarations: [
    {
      name: 'update_bid_status',
      description: 'Altera o status de uma licitação internamente no sistema Oráculo.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          bidId: { type: Type.STRING, description: 'ID único da licitação' },
          newStatus: { type: Type.STRING, enum: Object.values(BidStatus), description: 'Novo status para aplicar' },
        },
        required: ['bidId', 'newStatus'],
      },
    }
  ]
};

const searchTool = { googleSearch: {} };

export const extractBidMetadata = async (fileBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        parts: [
          { inlineData: { data: fileBase64, mimeType } },
          { text: `Você é um especialista em licitações brasileiras da Kits Vital. 
          Analise este documento (Edital/Aviso) e extraia com precisão:
          1. organ: Órgão/Prefeitura.
          2. biddingNumber: Número do Pregão/Processo.
          3. title: Objeto da compra.
          4. date: Data/Hora ISO (YYYY-MM-DDTHH:mm).
          5. notes: Exigências críticas (ANVISA/Amostras).` }
        ]
      }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            organ: { type: Type.STRING },
            biddingNumber: { type: Type.STRING },
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            notes: { type: Type.STRING }
          },
          required: ["organ", "biddingNumber", "title"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Erro Maya Extraction:", error);
    throw new Error("Erro na extração.");
  }
};

export const generateProposalDraft = async (bid: Bid) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: `Crie proposta comercial Kits Vital para ${bid.title}. Itens: ${JSON.stringify(bid.items)}.` }] }]
  });
  return response.text;
};

export const chatWithMaya = async (
  message: string, 
  history: { role: 'user' | 'model', text: string }[],
  fileData?: { data: string, mimeType: string }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const isRadar = message.toLowerCase().includes('radar') || 
                    message.toLowerCase().includes('busca') || 
                    message.toLowerCase().includes('licitaç');

    // 1. Limpeza rigorosa para evitar "turnos consecutivos" (User-User ou Model-Model)
    let finalHistory = [];
    let lastRole = null;

    // Filtra histórico para garantir que seja sempre intercalado
    for (const h of history) {
      if (h.text && h.text.trim() !== "" && h.role !== lastRole) {
        finalHistory.push({
          role: h.role,
          parts: [{ text: h.text }]
        });
        lastRole = h.role;
      }
    }

    // A API EXIGE que o histórico comece com 'user'
    while (finalHistory.length > 0 && finalHistory[0].role !== 'user') {
      finalHistory.shift();
    }

    // Se o último turno do histórico for 'user', o próximo (que é nossa msg) 
    // causaria erro de role repetido. Removemos o último se necessário.
    if (finalHistory.length > 0 && finalHistory[finalHistory.length - 1].role === 'user') {
      finalHistory.pop();
    }

    const currentParts: any[] = [{ text: message }];
    if (fileData) {
      currentParts.push({ 
        inlineData: { data: fileData.data, mimeType: fileData.mimeType } 
      });
    }

    const contents = [...finalHistory, { role: 'user', parts: currentParts }];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        tools: isRadar ? [searchTool] : [functionTools],
        systemInstruction: `Você é Maya AI, inteligência operacional da Kits Vital. 
        Contexto Kits Vital: ${KITS_VITAL_CONTEXT}.
        Sua função é gerir licitações e radar de oportunidades. Seja direta e técnica.`,
      },
    });

    return {
      text: response.text,
      functionCalls: response.functionCalls,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("MAYA FAIL:", error);
    return { 
      text: "Maya teve um problema na sincronização de turnos. Pode repetir?" 
    };
  }
};
