
import { GoogleGenAI } from "@google/genai";
import { AssessmentData, StoryData } from "../types";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing in process.env");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Chat Functionality
export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  onChunk: (text: string) => void
) => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `你是一位专业的乡村留守儿童心理辅导助手，名叫"康康老师"。
      你的目标是为乡村教师和儿童提供温暖、专业、易懂的心理支持。
      特点：温暖、耐心、富有同理心。
      针对留守儿童常见的：分离焦虑、自卑、隔代教育矛盾等问题提供具体建议。
      
      【重要排版要求】：
      1. 请不要输出一大段密集的文字。
      2. 每一个观点或建议之间，必须换行，并空出一行，形成清晰的段落。
      3. 适当使用Emoji表情符号增加亲和力。
      4. 语气要像讲故事一样娓娓道来。`,
    },
    history: history,
  });

  const result = await chat.sendMessageStream({ message });
  
  for await (const chunk of result) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
};

// Image Generation
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: prompt }]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received");
  } catch (e) {
    console.error("Image gen failed", e);
    throw e;
  }
};

export const generateImageFromSketch = async (prompt: string, imageBase64: string): Promise<string> => {
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          { text: `Based on this sketch, generate a high-quality, beautiful artistic image. ${prompt}` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received from sketch");
  } catch (e) {
    console.error("Sketch gen failed", e);
    throw e;
  }
};

// Assessment Analysis
export const analyzeAssessment = async (data: AssessmentData): Promise<string> => {
  const prompt = `
    作为资深儿童心理专家，请根据以下留守儿童的评估数据生成一份详细的分析报告：
    
    基本信息：${data.childName} (${data.childAge}岁, ${data.childGender})
    生活习惯：睡眠-${data.sleep}, 电子产品-${data.electronics}
    社交与困扰：同伴关系-${data.peerRel}, 困扰-${data.concerns.join(', ')}
    简要备注：${data.notes}
    **详细情况描述**：${data.details}
    
    请包含：
    1. 🎯 **心理状态总体评估** (给出风险等级：低/中/高)
    2. 🔍 **潜在问题深度分析** (结合详细描述，分析留守背景下的心理成因)
    3. 💡 **针对性的干预建议** (分别给老师、家长/监护人、孩子的具体行动建议)
    
    排版要求：分段清晰，重点突出，语气温暖专业。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "无法生成评估报告";
};

// Story Generation
export const generateStory = async (keywords: string, ageGroup: string, length: string, tone: string): Promise<StoryData> => {
  let lengthInstruction = "";
  if (length === 'short') {
    lengthInstruction = "目标字数约300-500字。故事要短小精悍，节奏轻快。";
  } else if (length === 'long') {
    lengthInstruction = "目标字数约1500字。这是一个长篇故事，需要有宏大的世界观、复杂的起承转合。";
  } else {
    lengthInstruction = "目标字数约800-1000字。标准中篇故事，情节完整。";
  }

  let toneInstruction = "";
  switch (tone) {
    case 'adventure': toneInstruction = "情感基调：【奇幻冒险】。充满想象力、惊险刺激。"; break;
    case 'happy': toneInstruction = "情感基调：【欢乐有趣】。幽默风趣，结局皆大欢喜。"; break;
    case 'brave': toneInstruction = "情感基调：【勇敢励志】。刻画主角克服恐惧。"; break;
    default: toneInstruction = "情感基调：【温馨治愈】。柔和、温暖，重点描写亲情或友情。"; break;
  }

  const prompt = `你是一位著名的儿童文学作家。请根据以下要求创作一个故事。
  
  关键词: "${keywords}"
  适用年龄: ${ageGroup}
  
  要求：
  1. ${lengthInstruction}
  2. ${toneInstruction}
  3. 必须包含具体的环境描写和细腻的心理活动描写。
  4. 包含人物对话。
  5. 寓教于乐。
  
  请按以下纯文本格式返回：
  标题：[标题]
  
  [故事内容]
  
  ---
  故事里的小道理：
  1. [道理1]
  2. [道理2]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text || "";
  
  const titleMatch = text.match(/标题：(.*?)\n/);
  const title = titleMatch ? titleMatch[1].trim() : "无题";
  
  const moralSectionIndex = text.indexOf("故事里的小道理：");
  let content = text;
  let moral: string[] = [];
  
  if (moralSectionIndex !== -1) {
    const afterTitleIndex = titleMatch ? titleMatch.index! + titleMatch[0].length : 0;
    content = text.substring(afterTitleIndex, moralSectionIndex).replace(/---/, '').trim();
    const moralText = text.substring(moralSectionIndex);
    const moralLines = moralText.split('\n').filter(line => line.match(/^\d+\./));
    moral = moralLines.map(line => line.replace(/^\d+\.\s*/, '').trim());
  } else {
    content = text.replace(/标题：.*?\n/, '').trim();
  }

  return {
    title,
    content,
    moral: moral.length > 0 ? moral : ["勇敢面对挑战", "相信自己"]
  };
};
