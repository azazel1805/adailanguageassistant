

import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { 
    HistoryItem, AnalysisResult, NewsResult, MockExamQuestion, ClozeTestResponse, PhrasalVerbOfTheDay, 
    FullStudyPlan, VocabularyItem, TranslationAnalysisResult, DialogueCompletionExercise, 
    ReadingAnalysisResult, WritingAnalysis, ParagraphImprovementResult, ListeningTask, PassageDeconstructionResult, 
    GroundingChunk, ParagraphCohesionAnalysis, SentenceDiagram, SentenceOrderingExercise, PerformanceReport, 
    PhrasalVerbDeconstructionResult, WeatherData, VisualDescriptionAnalysis, DictionaryEntry,
    Scenario, SimulatorChatMessage, PragmaticAnalysisResult, PerformanceStats, IdentifiedObject 
} from '../types.ts';
import { parseGeneratedQuestions, parseClozeTestJsonResponse } from "../utils/questionParser.ts";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
      soruTipi: { type: Type.STRING, description: "Tespit edilen soru tipi (Örn: Gramer - Tense, Akışı Bozan Cümle Sorusu)" },
      analiz: { 
          type: Type.OBJECT,
          description: "Sorunun detaylı analizi. Akışı bozan cümleler için adımları, diğerleri için ipuçlarını içerir.",
          properties: {
              ipucu_1: { type: Type.STRING },
              ipucu_2: { type: Type.STRING },
              kural: { type: Type.STRING },
              celdirici_analizi: { type: Type.STRING },
              adim_1_ana_tema: { type: Type.STRING },
              adim_2_cumle_1_iliskisi: { type: Type.STRING },
              adim_3_cumle_2_iliskisi: { type: Type.STRING },
              adim_4_cumle_3_iliskisi: { type: Type.STRING },
              adim_5_cumle_4_iliskisi: { type: Type.STRING },
              adim_6_cumle_5_iliskisi: { type: Type.STRING },
              adim_7_sonuc: { type: Type.STRING }
          }
      },
      konu: { type: Type.STRING, description: "Sorunun genel konusu" },
      zorlukSeviyesi: { type: Type.STRING, description: "Kolay/Orta/Zor" },
      dogruCevap: { type: Type.STRING, description: "Doğru seçeneğin harfi (Örn: C)" },
      detayliAciklama: { type: Type.STRING, description: "Doğru cevabın neden doğru olduğuna dair kapsamlı açıklama." },
      digerSecenekler: {
          type: Type.ARRAY,
          items: {
              type: Type.OBJECT,
              properties: {
                  secenek: { type: Type.STRING, description: "Seçenek harfi (Örn: A)" },
                  aciklama: { type: Type.STRING, description: "Bu seçeneğin neden yanlış olduğu." }
              },
              required: ["secenek", "aciklama"]
          }
      }
  },
  required: ["soruTipi", "analiz", "konu", "zorlukSeviyesi", "dogruCevap", "detayliAciklama", "digerSecenekler"]
};


const ANALYSIS_SYSTEM_INSTRUCTION = `
Sen İngilizce dil sınavları konusunda uzmanlaşmış, son derece dikkatli bir soru analisti ve eğitmensin. Sana bir İngilizce sınav sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını sağlanan JSON şemasına göre sunmaktır. DİKKAT: JSON çıktısındaki TÜM metin alanları (analizdeki tüm ipuçları ve adımlar, detayliAciklama, digerSecenekler'deki açıklamalar, konu vb.) MUTLAKA AMA MUTLAKA Türkçe olmalıdır. Sadece doğru cevap harfi (A,B,C,D,E) ve seçenek harfleri İngilizce karakter olabilir.

ANALİZ İÇİN KRİTİK NOTLAR:
- 'soruTipi' alanını sorunun içeriğine en uygun genel kategoriyle doldurmalısın. Örneğin, "Gramer", "Kelime", "Okuduğunu Anlama", "Cümle Tamamlama", "Anlamca En Yakın Cümle" gibi.
`;

// Schemas for JSON responses
const PHRASAL_VERB_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        phrasalVerb: { type: Type.STRING },
        meaning: { type: Type.STRING },
        examples: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    en: { type: Type.STRING },
                    tr: { type: Type.STRING }
                },
                required: ["en", "tr"]
            }
        }
    },
    required: ["phrasalVerb", "meaning", "examples"]
};

const WEATHER_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        city: { type: Type.STRING },
        temperature: { type: Type.NUMBER },
        description: { type: Type.STRING },
        icon: { type: Type.STRING, description: "A single emoji representing the weather." }
    },
    required: ["city", "temperature", "description", "icon"]
};

const READING_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: 'A concise summary of the passage in Turkish.' },
        vocabulary: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING, description: 'The Turkish meaning of the word.' }
                },
                required: ['word', 'meaning']
            }
        },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The comprehension question in English." },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING },
                                value: { type: Type.STRING, description: "The option text in English." }
                            },
                            required: ['key', 'value']
                        }
                    },
                    correctAnswer: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswer']
            }
        }
    },
    required: ['summary', 'vocabulary', 'questions']
};

const WRITING_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        overallFeedback: { type: Type.STRING, description: "General feedback on the essay in Turkish." },
        grammar: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    error: { type: Type.STRING, description: "The original grammatical error in English." },
                    correction: { type: Type.STRING, description: "The corrected version in English." },
                    explanation: { type: Type.STRING, description: "A brief explanation of the grammar rule in Turkish." }
                },
                required: ['error', 'correction', 'explanation']
            }
        },
        vocabulary: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING, description: "The original word/phrase in English." },
                    suggestion: { type: Type.STRING, description: "A better vocabulary suggestion in English." },
                    reason: { type: Type.STRING, description: "The reason for the suggestion in Turkish." }
                },
                required: ['original', 'suggestion', 'reason']
            }
        },
        structureAndCohesion: { type: Type.STRING, description: "Feedback on the essay's structure and cohesion in Turkish." }
    },
    required: ['overallFeedback', 'grammar', 'vocabulary', 'structureAndCohesion']
};

const VISUAL_DESCRIPTION_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        overallFeedback: { type: Type.STRING, description: "Genel değerlendirme (Türkçe)." },
        grammar: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    error: { type: Type.STRING, description: "The original grammatical error in English." },
                    correction: { type: Type.STRING, description: "The corrected version in English." },
                    explanation: { type: Type.STRING, description: "A brief explanation of the grammar rule in Turkish." }
                },
                required: ['error', 'correction', 'explanation']
            }
        },
        vocabulary: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING, description: "The original word/phrase in English." },
                    suggestion: { type: Type.STRING, description: "A better vocabulary suggestion in English." },
                    reason: { type: Type.STRING, description: "The reason for the suggestion in Turkish." }
                },
                required: ['original', 'suggestion', 'reason']
            }
        },
        descriptiveStrengths: { type: Type.STRING, description: "Kullanıcının neleri iyi betimlediğine dair geri bildirim (Türkçe)." },
        improvementSuggestions: {
            type: Type.ARRAY,
            description: "Anlatımı geliştirmeye yönelik 2-3 adet öneri.",
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING, description: "The suggestion in English (e.g., 'Use more sensory details')." },
                    example: { type: Type.STRING, description: "An example of the suggestion applied, in English, based on the user's text." },
                    explanation: { type: Type.STRING, description: "The explanation of why this helps, in Turkish." }
                },
                required: ['suggestion', 'example', 'explanation']
            }
        }
    },
    required: ['overallFeedback', 'grammar', 'vocabulary', 'descriptiveStrengths', 'improvementSuggestions']
};

const PARAGRAPH_IMPROVEMENT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        originalParagraph: { type: Type.STRING },
        improvedParagraph: { type: Type.STRING },
        explanation: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    change: { type: Type.STRING },
                    reason: { type: Type.STRING }
                },
                required: ['change', 'reason']
            }
        }
    },
    required: ['originalParagraph', 'improvedParagraph', 'explanation']
};

const LISTENING_TASK_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        script: { type: Type.STRING },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING },
                                value: { type: Type.STRING }
                            },
                            required: ['key', 'value']
                        }
                    },
                    correctAnswer: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswer']
            }
        }
    },
    required: ['script', 'questions']
};

const PASSAGE_DECONSTRUCTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        mainIdea: { type: Type.STRING },
        authorTone: { type: Type.STRING },
        deconstructedSentences: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    originalSentence: { type: Type.STRING },
                    simplifiedSentence: { type: Type.STRING },
                    grammarExplanation: { type: Type.STRING },
                    vocabulary: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                meaning: { type: Type.STRING }
                            },
                            required: ['word', 'meaning']
                        }
                    }
                },
                required: ['originalSentence', 'simplifiedSentence', 'grammarExplanation', 'vocabulary']
            }
        }
    },
    required: ['mainIdea', 'authorTone', 'deconstructedSentences']
};

const NEWS_QUESTIONS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING },
                                value: { type: Type.STRING }
                            },
                            required: ['key', 'value']
                        }
                    },
                    correctAnswer: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswer']
            }
        }
    },
    required: ['questions']
};

const COHESION_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        overallCohesion: { type: Type.STRING },
        mainIdea: { type: Type.STRING },
        sentenceAnalyses: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING },
                    role: { type: Type.STRING },
                    connection: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    rating: { 
                        type: Type.STRING,
                        description: "Cümlenin paragrafa bağlantı gücü. Sadece 'Güçlü', 'Orta', veya 'Zayıf' değerlerinden birini kullan."
                    }
                },
                required: ['sentence', 'role', 'connection', 'suggestion', 'rating']
            }
        }
    },
    required: ['overallCohesion', 'mainIdea', 'sentenceAnalyses']
};

const SENTENCE_DIAGRAM_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        parts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['text', 'type', 'description']
            }
        }
    },
    required: ['parts']
};

const STUDY_PLAN_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        overallRecommendation: { type: Type.STRING },
        weeks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    weekNumber: { type: Type.NUMBER },
                    weeklyFocus: { type: Type.STRING },
                    dailyTasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.STRING },
                                tasks: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            description: { type: Type.STRING },
                                            action: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    navigateTo: { type: Type.STRING },
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    required: ['overallRecommendation', 'weeks']
};

const PDF_EXAM_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionNumber: { type: Type.NUMBER },
                    questionType: { type: Type.STRING },
                    passage: { type: Type.STRING },
                    questionText: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING },
                                value: { type: Type.STRING }
                            },
                            required: ['key', 'value']
                        }
                    },
                    correctAnswer: { type: Type.STRING }
                },
                required: ['questionNumber', 'questionText', 'options', 'correctAnswer']
            }
        }
    },
    required: ['questions']
};

const SENTENCE_ORDERING_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        sentences: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        analysis: {
            type: Type.OBJECT,
            properties: {
                correctOrderIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER }
                },
                explanation: { type: Type.STRING }
            },
            required: ['correctOrderIndices', 'explanation']
        }
    },
    required: ['sentences', 'analysis']
};

const PERFORMANCE_REPORT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        objectiveCompletion: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    objective: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN },
                    reasoning: { type: Type.STRING }
                },
                required: ['objective', 'completed', 'reasoning']
            }
        },
        overallFeedback: { type: Type.STRING },
        pronunciationFeedback: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    feedback: { type: Type.STRING }
                },
                required: ['word', 'feedback']
            }
        },
        grammarFeedback: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    error: { type: Type.STRING },
                    correction: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ['error', 'correction', 'explanation']
            }
        },
        vocabularySuggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    reason: { type: Type.STRING }
                },
                required: ['original', 'suggestion', 'reason']
            }
        }
    },
    required: ['objectiveCompletion', 'overallFeedback', 'pronunciationFeedback', 'grammarFeedback', 'vocabularySuggestions']
};

const PHRASAL_VERB_DECONSTRUCTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        mainVerb: { type: Type.OBJECT, properties: { verb: { type: Type.STRING }, meaning: { type: Type.STRING } } },
        particle: { type: Type.OBJECT, properties: { particle: { type: Type.STRING }, meaning: { type: Type.STRING } } },
        idiomaticMeaning: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, explanation: { type: Type.STRING } } },
        exampleSentences: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    en: { type: Type.STRING },
                    tr: { type: Type.STRING }
                },
                required: ['en', 'tr']
            }
        }
    },
    required: ['mainVerb', 'particle', 'idiomaticMeaning', 'exampleSentences']
};

const TRANSLATION_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        originalSentenceAnalysis: {
            type: Type.OBJECT,
            properties: {
                language: { type: Type.STRING },
                keyGrammar: { type: Type.STRING },
                keyVocabulary: { type: Type.STRING }
            },
            required: ['language', 'keyGrammar', 'keyVocabulary']
        },
        translations: {
            type: Type.OBJECT,
            properties: {
                literal: { type: Type.STRING },
                natural: { type: Type.STRING },
                academic: { type: Type.STRING }
            },
            required: ['literal', 'natural', 'academic']
        },
        translationRationale: { type: Type.STRING },
        reverseTranslation: { type: Type.STRING }
    },
    required: ['originalSentenceAnalysis', 'translations', 'translationRationale', 'reverseTranslation']
};

const DIALOGUE_COMPLETION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        situation: { type: Type.STRING },
        finalSentence: {
            type: Type.OBJECT,
            properties: {
                speaker: { type: Type.STRING },
                text: { type: Type.STRING }
            },
            required: ['speaker', 'text']
        },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    optionKey: { type: Type.STRING },
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING }
                },
                required: ['optionKey', 'speaker', 'text']
            }
        },
        correctOptionKey: { type: Type.STRING },
        analysis: {
            type: Type.OBJECT,
            properties: {
                correctExplanation: { type: Type.STRING },
                distractorExplanations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            optionKey: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                        },
                        required: ['optionKey', 'explanation']
                    }
                }
            },
            required: ['correctExplanation', 'distractorExplanations']
        }
    },
    required: ['situation', 'finalSentence', 'options', 'correctOptionKey', 'analysis']
};

const PRAGMATIC_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        formality: { type: Type.STRING },
        tone: { type: Type.STRING },
        intent: { type: Type.STRING },
        audience: { type: Type.STRING },
        alternatives: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ['type', 'text', 'explanation']
            }
        }
    },
    required: ['formality', 'tone', 'intent', 'audience', 'alternatives']
};

const DICTIONARY_ENTRY_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        pronunciation: { type: Type.STRING, description: "The IPA pronunciation of the word. Omit if not applicable." },
        turkishMeaning: { type: Type.STRING, description: "The most common Turkish equivalent of the word." },
        definitions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of English definitions for the word."
        },
        synonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of synonyms. Provide an empty array if not applicable."
        },
        antonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of antonyms. Provide an empty array if not applicable."
        },
        etymology: { type: Type.STRING, description: "A brief origin of the word. Omit if not applicable." },
        exampleSentences: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-4 example sentences."
        },
    },
    required: ["turkishMeaning", "definitions", "exampleSentences"]
};

const VISUAL_DICTIONARY_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            englishName: { type: Type.STRING, description: "The name of the object in English." },
            turkishName: { type: Type.STRING, description: "The Turkish translation of the object name." }
        },
        required: ["englishName", "turkishName"]
    }
};

// --- Helper function for streaming responses ---
async function* streamToAsyncIterator(stream: AsyncGenerator<GenerateContentResponse, any, unknown>): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
        yield chunk.text;
    }
}

// --- Service Functions ---

export const analyzeQuestion = async (question: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: question,
            config: {
                responseMimeType: 'application/json',
                responseSchema: ANALYSIS_SCHEMA,
                systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing question:", error);
        throw new Error("Soru analizi sırasında bir hata oluştu. Lütfen girdiğinizi kontrol edin veya daha sonra tekrar deneyin.");
    }
};

export const getPhrasalVerbOfTheDay = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bana İngilizce sınavlarda sıkça çıkan, orta-zor seviyede bir "phrasal verb" ve onunla ilgili bilgileri JSON formatında ver. JSON, "phrasalVerb", "meaning" (Türkçe anlamı) ve "examples" (her biri "en" ve "tr" alanları içeren iki örnek cümle) alanlarını içermelidir.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: PHRASAL_VERB_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching phrasal verb:", error);
        throw new Error("Günün deyimi alınamadı.");
    }
};

export const getWeatherForLocation = async (lat: number, lon: number): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide the current weather for latitude ${lat} and longitude ${lon} in a JSON object. The object must include "city" (string), "temperature" (number in Celsius), "description" (string in Turkish), and "icon" (a single emoji).`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: WEATHER_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching weather:", error);
        throw new Error("Hava durumu bilgisi alınamadı.");
    }
};

export const createTutorChatSession = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "Sen 'Onur', genel İngilizce konularında uzman, sabırlı ve teşvik edici bir yapay zeka eğitmensin. Kullanıcıların sorularını net, anlaşılır ve adım adım açıklamalarla yanıtla. Karmaşık konuları basitleştir ve bolca örnek ver. Kullanıcının moralini yüksek tut ve öğrenme sürecini destekle. Cevapların her zaman Türkçe olmalı."
        }
    });
};

export const createCreativeWritingSession = (format: string, start: string): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are 'Alex', a creative writing partner. You will collaborate with the user to write a piece of creative writing IN ENGLISH. The user has chosen the format: "${format}". Their starting point, which may be keywords or a sentence in any language, is: "${start}". Your role is to take this starting point and begin writing a story IN ENGLISH. Then, continue the story from where the user leaves off, adding a few sentences or a short paragraph at a time, always IN ENGLISH. Match the user's tone and style, but maintain the language as English. Be creative and keep the story moving forward. Your responses must ONLY contain the next part of the story in English, with no conversational filler or extra text.`
        }
    });
};


export const getDictionaryEntry = async (word: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide a detailed dictionary entry for the English word/phrase "${word}" in JSON format according to the schema.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: DICTIONARY_ENTRY_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching dictionary entry:", error);
        throw new Error("Sözlük girdisi alınamadı.");
    }
};

export const getWritingTopic = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a single, interesting English essay topic suitable for an upper-intermediate (B2/C1) learner. The topic should be a question or a statement to discuss. Respond with ONLY the topic itself, no extra text.",
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting writing topic:", error);
        throw new Error("Yazma konusu alınamadı.");
    }
};

export const generateSimilarQuiz = async (analysis: AnalysisResult, originalQuestion: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the analysis of the following question, generate a 5-question mini-quiz. The new questions should be on the same topic ("${analysis.konu}") and of the same question type ("${analysis.soruTipi}") and difficulty ("${analysis.zorlukSeviyesi}"). Format the output as plain text with questions numbered 1-5, options A-E, and clearly mark the correct answer for each (e.g., "Correct answer: C").\n\n--- ORIGINAL QUESTION ---\n${originalQuestion}\n\n--- ANALYSIS ---\n${JSON.stringify(analysis, null, 2)}`
        });
        return response.text;
    } catch (error) {
        console.error("Error generating similar quiz:", error);
        throw new Error("Benzer sorulardan oluşan quiz oluşturulamadı.");
    }
};


export const analyzeReadingPassage = async (passage: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following English passage. Provide a response in JSON format according to the schema. 
IMPORTANT LANGUAGE RULES:
- The 'summary' must be in Turkish.
- The 'vocabulary' meanings must be in Turkish.
- The 'questions' and their 'options' MUST BE in English.
Generate 3-4 multiple-choice questions based on the passage.\n\nPassage:\n${passage}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: READING_ANALYSIS_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing reading passage:", error);
        throw new Error("Okuma parçası analizi sırasında bir hata oluştu.");
    }
};

export const analyzeWrittenText = async (topic: string, text: string): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as an expert English writing tutor. Analyze the following English essay written on the topic "${topic}". Provide feedback in JSON format according to the schema.

IMPORTANT LANGUAGE RULES:
- \`overallFeedback\`, \`structureAndCohesion\`, grammar \`explanation\`, and vocabulary \`reason\` MUST be in Turkish.
- All other fields, including grammar \`error\` and \`correction\`, and vocabulary \`original\` and \`suggestion\`, MUST be in English.

Essay:\n${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: WRITING_ANALYSIS_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing written text:", error);
        throw new Error("Yazılı metin analizi sırasında bir hata oluştu.");
    }
};

export const analyzeVisualDescription = async (text: string): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as an English writing coach. Analyze the following English description of an image. Your goal is to help the user become a more descriptive writer.
Provide feedback in JSON format according to the schema.

IMPORTANT LANGUAGE RULES:
- \`overallFeedback\`, \`descriptiveStrengths\`, grammar \`explanation\`, vocabulary \`reason\`, and improvement \`explanation\` MUST be in Turkish.
- All other fields, including grammar corrections, vocabulary suggestions, and improvement examples/suggestions, MUST be in English.

In the 'improvementSuggestions', provide 2-3 concrete tips on how to make the description more vivid and engaging. For each tip, give a specific example based on the user's text.

Description:\n${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: VISUAL_DESCRIPTION_ANALYSIS_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing visual description:", error);
        throw new Error("Görsel tanım analizi sırasında bir hata oluştu.");
    }
};

export const improveParagraph = async (paragraph: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Take the following English paragraph and improve it for clarity, flow, and vocabulary. Provide the response in JSON format according to the schema. The explanation reasons must be in Turkish.\n\nParagraph:\n${paragraph}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: PARAGRAPH_IMPROVEMENT_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error improving paragraph:", error);
        throw new Error("Paragraf iyileştirme sırasında bir hata oluştu.");
    }
};

export const generateListeningTask = async (difficulty: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a short English listening task of "${difficulty}" difficulty. Provide a response in JSON format according to the schema. The task should include a script (around 4-6 sentences) and 3 multiple-choice questions about the script.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: LISTENING_TASK_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating listening task:", error);
        throw new Error("Dinleme görevi oluşturulamadı.");
    }
};

export const deconstructPassage = async (passage: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Deconstruct the following English passage. For each sentence, provide a simplified version IN ENGLISH, a grammar explanation IN TURKISH, and key vocabulary with their Turkish meanings. Also, provide the main idea and author's tone for the whole passage IN ENGLISH. The response must be in JSON format according to the schema. IMPORTANT: The fields 'simplifiedSentence', 'mainIdea', and 'authorTone' MUST BE in English. The 'grammarExplanation' and the 'meaning' field for each vocabulary item MUST BE in Turkish.\n\nPassage:\n${passage}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: PASSAGE_DECONSTRUCTION_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error deconstructing passage:", error);
        throw new Error("Metin analizi sırasında bir hata oluştu.");
    }
};

export const getNewsSummary = async (topic: string): Promise<NewsResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide a detailed, recent news summary about "${topic}". The summary should be a single, well-written paragraph in English.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
        
        return {
            text: response.text,
            sources: sources
        };

    } catch (error) {
        console.error("Error fetching news summary:", error);
        throw new Error("Haber özeti alınamadı. Lütfen daha sonra tekrar deneyin.");
    }
};

export const generateNewsQuestions = async (paragraph: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following news paragraph, generate a JSON object containing a list of 3 multiple-choice comprehension questions. Each question should have options and a correct answer key.\n\nParagraph:\n${paragraph}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: NEWS_QUESTIONS_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating news questions:", error);
        throw new Error("Haber soruları oluşturulamadı.");
    }
};

export const diagramSentence = async (sentence: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the grammatical structure of the following English sentence. Break it down into its constituent parts (subject, verb, object, clauses, phrases, etc.). Provide the response in JSON format according to the schema. The descriptions for each part must be in Turkish.\n\nSentence: "${sentence}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: SENTENCE_DIAGRAM_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error diagramming sentence:", error);
        throw new Error("Cümle analizi sırasında bir hata oluştu.");
    }
};

export const analyzeParagraphCohesion = async (paragraph: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the cohesion and flow of the following English paragraph. For each sentence, identify its role, its connection to the previous sentence, and suggest improvements if any. Also, provide an overall cohesion assessment and the main idea. The response must be in JSON format according to the schema. All analysis text (role, connection, suggestion, etc.) must be in Turkish.\n\nParagraph:\n${paragraph}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: COHESION_ANALYSIS_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing paragraph cohesion:", error);
        throw new Error("Paragraf analizi sırasında bir hata oluştu.");
    }
};

export const generateStudyPlan = async (performanceStats: PerformanceStats, targetDate: string, weeklyHours: number): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bir öğrencinin genel İngilizce beceri performansına, hedef tarihine ve haftalık çalışma süresine göre, ona özel, haftalara bölünmüş, etkileşimli bir çalışma planı oluştur. Plan, öğrencinin en zayıf olduğu becerilere odaklanmalı ve pratik yapmak için belirli ADAI uygulama araçlarına ('reading', 'listening', 'vocabulary', 'writing' vb.) yönlendirmelidir. Yanıtın JSON formatında ve belirtilen şemaya uygun olmalıdır. Tüm metin alanları (öneriler, görevler vb.) Türkçe olmalıdır.\n\nPerformans Özeti: ${JSON.stringify(performanceStats, null, 2)}\nHedef Tarih: ${targetDate}\nHaftalık Çalışma Saati: ${weeklyHours}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: STUDY_PLAN_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating study plan:", error);
        throw new Error("Çalışma planı oluşturulamadı.");
    }
};

export const extractExamFromPDF = async (file: File): Promise<string> => {
    // Browser-compatible way to convert ArrayBuffer to Base64, replacing Node.js Buffer
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    const filePart = {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    filePart,
                    { text: `Bu PDF dosyasından bir deneme sınavı çıkar. Her soru için soru numarasını, soru tipini, varsa paragraf metnini, soru metnini, A'dan E'ye şıkları ve doğru cevabı ayıkla. Cevap anahtarı genellikle PDF'in sonunda bulunur. Sonucu JSON formatında ve belirtilen şemaya uygun olarak döndür.` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: PDF_EXAM_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error extracting exam from PDF:", error);
        throw new Error("PDF'den sınav çıkarılırken bir hata oluştu. Dosyanın okunabilir olduğundan ve bir cevap anahtarı içerdiğinden emin olun.");
    }
};

export const generateSentenceOrderingExercise = async (difficulty: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a sentence ordering exercise of "${difficulty}" difficulty. Provide a response in JSON format according to the schema. The response should include a list of 5 jumbled English sentences and an analysis object containing the correct order (as an array of original indices from 0 to 4) and a detailed Turkish explanation of the logic behind the correct order (e.g., pronoun references, chronological order, topic sentences).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: SENTENCE_ORDERING_SCHEMA
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating sentence ordering exercise:", error);
        throw new Error("Cümle sıralama alıştırması oluşturulamadı.");
    }
};

export const analyzeConversationForReport = async (scenario: Scenario, conversation: SimulatorChatMessage[]): Promise<string> => {
    // Truncate conversation if it's too long to avoid API errors
    const truncatedConversation = conversation.slice(-30);
    const transcript = truncatedConversation.map(msg => `${msg.speaker === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please act as an expert English language tutor. Analyze the following conversation transcript from a role-playing simulation. Your response must be in JSON format according to the provided schema. All feedback, reasoning, and explanations must be in ENGLISH.

**Scenario Details:**
- User's Role: ${scenario.userRole}
- AI's Role: ${scenario.aiRole}
- Objectives: ${scenario.objectives.join(', ')}

**Conversation Transcript:**
${transcript}

Provide a detailed performance report based on the transcript and the user's objectives.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: PERFORMANCE_REPORT_SCHEMA,
                 systemInstruction: "You are an expert English language tutor providing a detailed analysis of a user's speaking performance in a role-play scenario. Your entire output must be a valid JSON object matching the provided schema. All feedback must be in English."
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing conversation:", error);
        throw new Error("Could not generate the performance report. The conversation may have been too short or an API error occurred.");
    }
};

export const deconstructPhrasalVerb = async (phrasalVerb: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Deconstruct the phrasal verb "${phrasalVerb}". Provide the response in JSON format. Explain the literal meaning of the main verb and the particle separately. Then, explain the idiomatic meaning and how it's derived. Provide 3 example sentences with Turkish translations. All explanations and meanings must be in Turkish.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: PHRASAL_VERB_DECONSTRUCTION_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error deconstructing phrasal verb:", error);
        throw new Error("Phrasal verb analizi sırasında bir hata oluştu.");
    }
};

export const generateVocabularyStory = async (words: VocabularyItem[]): Promise<string> => {
    const wordList = words.map(item => `"${item.word}" (meaning: ${item.meaning})`).join(', ');
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a short, simple, and coherent story in English (about 100-150 words) that correctly uses all of the following words: ${wordList}. The story should be easy to understand for an intermediate English learner. Respond with ONLY the story text, no titles or extra explanations.`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating vocabulary story:", error);
        throw new Error("Hikaye oluşturulamadı.");
    }
};

export const analyzeAndTranslateSentence = async (sentence: string, direction: 'tr_to_en' | 'en_to_tr'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze and translate the following sentence: "${sentence}". The translation direction is ${direction}. Provide a response in JSON format. First, analyze the original sentence's key grammar and vocabulary. Then, provide three translation alternatives: "literal", "natural", and "academic". Explain the rationale behind the natural translation. Finally, provide a "reverseTranslation" of the natural version back to the original language to check for meaning preservation. All analysis and rationale must be in Turkish.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: TRANSLATION_ANALYSIS_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing translation:", error);
        throw new Error("Çeviri analizi sırasında bir hata oluştu.");
    }
};

export const generateDialogueExercise = async (difficulty: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create an interactive dialogue completion exercise of "${difficulty}" difficulty. The response must be a JSON object according to the schema. The exercise should present a situation, a final line from a speaker in a dialogue, and five options for the preceding line. Provide a detailed analysis explaining why the correct option fits and why the others are wrong. All text (situation, dialogue, options, analysis) must be in English.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: DIALOGUE_COMPLETION_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating dialogue exercise:", error);
        throw new Error("Diyalog alıştırması oluşturulamadı.");
    }
};


export const analyzePragmatics = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the pragmatics of the following English text: "${text}". The response must be a JSON object matching the schema.

IMPORTANT LANGUAGE RULES:
- The 'alternatives' (both 'type' and 'text' fields) MUST be in English.
- All other fields ('formality', 'tone', 'intent', 'audience', and the 'explanation' for each alternative) MUST be in Turkish.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: PRAGMATIC_ANALYSIS_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing pragmatics:", error);
        throw new Error("Pragmatik analiz sırasında bir hata oluştu.");
    }
};

export const identifyObjectsInImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Image,
        },
    };
    const textPart = {
        text: `Identify the main, distinct objects in this image. For each object, provide its common English name and its Turkish translation. Respond in JSON format according to the schema. Focus on 5-10 of the most prominent objects.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: VISUAL_DICTIONARY_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error identifying objects in image:", error);
        throw new Error("Görseldeki nesneler tanımlanırken bir hata oluştu.");
    }
};
