import { GoogleGenAI } from "@google/genai";
import { Expense, GroundingSource } from '../types';

interface AdvisorResponse {
  text: string;
  sources: GroundingSource[];
}

// Helper para procesar grounding chunks
const processGrounding = (response: any): GroundingSource[] => {
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] =
      groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(
          (web: any): web is GroundingSource =>
            !!(web && web.uri && web.title)
        )
        .map((web: any) => ({ uri: web.uri, title: web.title })) ?? [];

    return Array.from(new Map(sources.map(s => [s.uri, s])).values());
};

export const getFinancialAdvice = async (
  userInput: string,
  budget: number,
  dailyLimit: number,
  expenses: Expense[]
): Promise<AdvisorResponse> => {
  try {
    // Obtener API Key exclusivamente de process.env.API_KEY
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("API Key no configurada.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const recentExpenses = expenses.slice(0, 15); // Aumentado contexto
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // Cálculo de HOY Específico
    const spentToday = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getDate() === dayOfMonth && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        })
        .reduce((acc, e) => acc + e.amount, 0);
    
    const todayBalance = dailyLimit - spentToday;

    // Cálculo Rollover
    const idealSpentByNow = dailyLimit * dayOfMonth;
    const rolloverBalance = idealSpentByNow - totalSpent;
    
    // Análisis 50/30/20
    const needsCategories = ['Vivienda', 'Servicios', 'Alimentación', 'Salud', 'Educación', 'Transporte'];
    const wantsCategories = ['Entretenimiento', 'Ropa', 'General'];
    const savingsDebtCategories = ['Ahorro/Inversión', 'Deudas'];

    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsDebtTotal = 0;

    expenses.forEach(e => {
        if (needsCategories.includes(e.category)) needsTotal += e.amount;
        else if (wantsCategories.includes(e.category)) wantsTotal += e.amount;
        else savingsDebtTotal += e.amount;
    });

    // Agrupar gastos por categoría para contexto
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });
    const topCategories = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([cat, amount]) => `${cat}: $U ${amount.toFixed(2)}`)
        .join(', ');

    const financialContext = `
      PERFIL: Familia Jhonny (Uruguay)
      MONEDA: Pesos Uruguayos ($U)
      
      ESTADO ACTUAL:
      - Presupuesto Mensual Total: $U ${budget.toFixed(2)}
      - Meta Diaria Objetivo: $U ${dailyLimit.toFixed(2)}
      
      ANÁLISIS DE HOY (${today.toLocaleDateString('es-UY')}):
      - Gastado HOY: $U ${spentToday.toFixed(2)}
      - Balance Diario (Meta - Gasto): $U ${todayBalance.toFixed(2)}
      - Situación: ${todayBalance >= 0 ? 'Superávit (Ahorro hoy)' : 'Déficit (Exceso hoy)'}

      CONTROL ACUMULADO (Rollover):
      - Saldo Acumulado del Mes: $U ${rolloverBalance.toFixed(2)}
      - ${rolloverBalance >= 0 ? 'La familia tiene ahorros acumulados.' : 'La familia tiene un déficit acumulado, debe recortar gastos.'}
      
      DISTRIBUCIÓN (Regla 50/30/20):
      - Necesidades: $U ${needsTotal.toFixed(2)}
      - Deseos: $U ${wantsTotal.toFixed(2)}
      - Ahorro/Deudas: $U ${savingsDebtTotal.toFixed(2)}

      - Top Gastos: ${topCategories}
    `.trim();

    const fullPrompt = `
      Actúa como el Asesor Financiero Personal de élite para la "Familia Jhonny". 
      Tu objetivo es maximizar el rendimiento de su dinero en Uruguay ($U).
      
      CONTEXTO FINANCIERO:
      ${financialContext}

      PREGUNTA DE LA FAMILIA: "${userInput}"

      INSTRUCCIONES:
      1. Mira primero el "ANÁLISIS DE HOY". Si están en rojo (déficit hoy), avísales inmediatamente cuánto se pasaron. Si ahorraron hoy, felicítalos.
      2. Si preguntan "¿cómo vamos?", dales el resumen de hoy y luego el acumulado.
      3. Sé proactivo: Si gastaron mucho en "Deseos", aconséjales moderación.
      4. Usa formato Markdown, negritas para los números importantes ($U).
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    return { text: response.text || "No pude analizar los datos en este momento.", sources: processGrounding(response) };
  } catch (error) {
    console.error("Error getting financial advice:", error);
    return {
      text: "Lo siento, familia Jhonny. Hubo un error técnico al procesar sus finanzas. Por favor intenten nuevamente.",
      sources: []
    };
  }
};

export const generateFinancialReport = async (
    budget: number, 
    expenses: Expense[],
    monthName: string
): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key no configurada");

        const ai = new GoogleGenAI({ apiKey });

        const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const balance = budget - totalSpent;
        
        const byCategory: Record<string, number> = {};
        expenses.forEach(e => byCategory[e.category] = (byCategory[e.category] || 0) + e.amount);
        const categorySummary = Object.entries(byCategory)
            .map(([k, v]) => `- ${k}: $U ${v.toFixed(2)}`)
            .join('\n');

        const prompt = `
            Genera un Informe Financiero Estratégico para la Familia Jhonny, correspondiente a ${monthName}.
            Moneda: Pesos Uruguayos ($U).
            
            DATOS:
            - Presupuesto: $U ${budget}
            - Gastado: $U ${totalSpent}
            - Balance: $U ${balance}
            - Desglose:
            ${categorySummary}
            
            FORMATO (Markdown):
            # 🇺🇾 Informe Financiero: Familia Jhonny (${monthName})
            
            ## 📊 Estado de Salud Financiera
            [Diagnóstico directo: ¿Estamos ahorrando o gastando de más?]
            
            ## 🔍 Análisis de Fugas
            [Análisis de categorías donde se va el dinero]
            
            ## 🚀 Plan de Acción (Próximo Mes)
            [3 pasos concretos para mejorar el ahorro en Uruguay]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "No se pudo generar el reporte.";
    } catch (error) {
        console.error("Error generating report:", error);
        return "Error al generar el informe.";
    }
};