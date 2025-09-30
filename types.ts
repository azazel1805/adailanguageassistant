

export type Tab = 'dashboard' | 'planner' | 'analyzer' | 'tutor' | 'reading' | 'deconstruction' | 'diagrammer' | 'cohesion_analyzer' | 'writing' | 'listening' | 'news' | 'dictionary' | 'vocabulary' | 'history' | 'pdf_importer' | 'vocabulary_story_weaver' | 'skill_tree' | 'sentence_ordering' | 'speaking_simulator' | 'phrasal_verb_deconstructor' | 'admin' | 'translation_analyst' | 'dialogue_completion' | 'visual_reading' | 'creative_writing' | 'pragmatic_analyzer' | 'visual_dictionary';

export interface AnalysisResult {
  soruTipi?: string;
  analiz?: {
    adim_1_ana_tema?: string;
    adim_2_cumle_1_iliskisi?: string;
    adim_3_cumle_2_iliskisi?: string;
    adim_4_cumle_4_iliskisi?: string;
    adim_5_cumle_5_iliskisi?: string;
    adim_6_cumle_5_iliskisi?: string;
    adim_7_sonuc?: string;
    [key: string]: any; 
  };
  konu?: string;
  zorlukSeviyesi?: string;
  dogruCevap?: string;
  detayliAciklama?: string;
  digerSecenekler?: {
    secenek: string;
    aciklama: string;
  }[];
}

export interface HistoryItem {
  id: string;
  question: string;
  analysis: AnalysisResult;
  timestamp: string;
}

export interface ParsedQuestion {
  id: number;
  fullText: string;
  questionText: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ReadingQuestion {
  question: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

export interface KeyVocabulary {
  word: string;
  meaning: string;
}

export interface ReadingAnalysisResult {
  summary: string;
  vocabulary: KeyVocabulary[];
  questions: ReadingQuestion[];
}

export interface StudyDay {
    day: number;
    focus: string;
    tasks: string[];
}

export interface PersonalizedFeedback {
  recommendation: string;
  studyPlan: StudyDay[];
}

export interface GrammarFeedback {
  error: string;
  correction: string;
  explanation: string;
}

export interface VocabularySuggestion {
  original: string;
  suggestion: string;
  reason: string;
}

export interface WritingAnalysis {
  overallFeedback: string;
  grammar: GrammarFeedback[];
  vocabulary: VocabularySuggestion[];
  structureAndCohesion: string;
}

export interface ImprovementSuggestion {
  suggestion: string; // English
  example: string;    // English
  explanation: string; // Turkish
}

export interface VisualDescriptionAnalysis {
  overallFeedback: string;
  grammar: GrammarFeedback[];
  vocabulary: VocabularySuggestion[];
  descriptiveStrengths: string;
  improvementSuggestions: ImprovementSuggestion[];
}

export interface ParagraphImprovementResult {
    originalParagraph: string;
    improvedParagraph: string;
    explanation: {
        change: string;
        reason: string;
    }[];
}

// Types for Listening Practice
export interface ListeningQuestion {
  question: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

export interface ListeningTask {
  script: string;
  questions: ListeningQuestion[];
}


// Types for Daily Challenge
export type ChallengeType = 'analyze' | 'dictionary' | 'tutor' | 'reading' | 'writing' | 'listening' | 'sentence_ordering' | 'speaking_simulator' | 'deconstruction' | 'diagrammer' | 'cohesion_analyzer' | 'dialogue_completion';

export interface DailyChallenge {
  id: string;
  description: string;
  type: ChallengeType;
  target: number;
  progress: number;
  completed: boolean;
}

export interface ChallengeState {
  currentChallenge: DailyChallenge | null;
  lastCompletedDate: string | null;
  streak: number;
}

// Type for Vocabulary Trainer
export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
}

// Type for Achievements
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Emoji
}

// Types for Passage Deconstruction
export interface DeconstructedSentence {
  originalSentence: string;
  simplifiedSentence: string;
  grammarExplanation: string;
  vocabulary: KeyVocabulary[];
}

export interface PassageDeconstructionResult {
  mainIdea: string;
  authorTone: string;
  deconstructedSentences: DeconstructedSentence[];
}

// Types for News Reader
export interface GroundingChunk {
  web: {
      uri: string;
      title: string;
  };
}

export interface NewsResult {
  text: string;
  sources: GroundingChunk[];
}

export interface NewsQuestion {
  question: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

// Types for Mock Exam (used by PDF Importer)
export interface MockExamQuestion {
  questionNumber: number;
  questionType: string;
  passage?: string;
  questionText: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

export interface ClozeTestResponse {
  clozeTests: {
    passage: string;
    questions: {
      blankNumber: number;
      questionType: string;
      options: string[];
      correctAnswer: string;
    }[];
  }[];
}

export interface MockExamStructure {
  questions: MockExamQuestion[];
}

export type PerformanceStats = {
    [type: string]: {
        correct: number;
        total: number;
    };
};

export interface MockExamResultData {
  id: string;
  timestamp: string;
  questions: MockExamQuestion[];
  userAnswers: { [key: number]: string };
  timeTaken: number; // in seconds
  score: number;
  totalQuestions: number;
  performanceByType: PerformanceStats;
}

// Types for Sentence Diagrammer
export interface SentencePart {
  text: string;
  type: string;
  description: string;
}

export interface SentenceDiagram {
  parts: SentencePart[];
}

// Types for Paragraph Cohesion Analyzer
export interface CohesionSentenceAnalysis {
  sentence: string;
  role: string;
  connection: string;
  suggestion: string;
  rating: 'Güçlü' | 'Orta' | 'Zayıf';
}

export interface ParagraphCohesionAnalysis {
  overallCohesion: string;
  mainIdea: string;
  sentenceAnalyses: CohesionSentenceAnalysis[];
}

// Type for Phrasal Verb of the Day Widget
export interface PhrasalVerbOfTheDay {
  phrasalVerb: string;
  meaning: string;
  examples: {
    en: string;
    tr: string;
  }[];
}

// Type for Preposition Visualizer Widget
export interface PrepositionData {
  preposition: string;
  explanation: string; // Turkish explanation
  exampleSentence: string;
  exampleSentenceTr: string; // Turkish translation of the example sentence
  pexelsQuery: string;
}


// Types for Smart Study Planner
export interface StudyTask {
  description: string;
  action?: {
    navigateTo: Tab; // Removed 'generator'
    config?: {
      questionType: string;
    };
  };
}

export interface WeeklyStudyPlan {
  weekNumber: number;
  weeklyFocus: string;
  dailyTasks: {
    day: string; // e.g., "Pazartesi"
    tasks: StudyTask[];
  }[];
}

export interface FullStudyPlan {
  overallRecommendation: string;
  weeks: WeeklyStudyPlan[];
}

// Types for Sentence Ordering
export interface SentenceOrderingExercise {
  sentences: string[];
  analysis: {
    correctOrderIndices: number[];
    explanation: string;
  };
}

// Types for Speaking Simulator
export interface Scenario {
    id: string;
    title: string;
    description: string;
    difficulty: 'Kolay' | 'Orta' | 'Zor';
    userRole: string;
    aiRole: string;
    aiWelcome: string;
    objectives: string[];
}

export interface SimulatorChatMessage {
    speaker: 'user' | 'ai';
    text: string;
}

export interface PerformanceReport {
    objectiveCompletion: {
        objective: string;
        completed: boolean;
        reasoning: string;
    }[];
    overallFeedback: string;
    pronunciationFeedback: {
        word: string;
        feedback: string;
    }[];
    grammarFeedback: GrammarFeedback[];
    vocabularySuggestions: VocabularySuggestion[];
}

// Types for Phrasal Verb Deconstructor
export interface PhrasalVerbDeconstructionResult {
  mainVerb: {
    verb: string;
    meaning: string;
  };
  particle: {
    particle: string;
    meaning: string;
  };
  idiomaticMeaning: {
    meaning: string;
    explanation: string;
  };
  exampleSentences: {
    en: string;
    tr: string;
  }[];
}

// Type for Time and Weather Widget
export interface WeatherData {
    city: string;
    temperature: number;
    description: string;
    icon: string; // Emoji
}

// Types for Interactive Translation Analyst
export interface TranslationAnalysisResult {
  originalSentenceAnalysis: {
    language: 'Türkçe' | 'İngilizce';
    keyGrammar: string;
    keyVocabulary: string;
  };
  translations: {
    literal: string;
    natural: string;
    academic: string;
  };
  translationRationale: string;
  reverseTranslation: string;
}

// Types for Interactive Dialogue Builder
export interface DialogueCompletionExercise {
  situation: string;
  finalSentence: {
    speaker: string;
    text: string;
  };
  options: {
    optionKey: string; // 'A', 'B', 'C', 'D', 'E'
    speaker: string;
    text: string;
  }[];
  correctOptionKey: string;
  analysis: {
    correctExplanation: string;
    distractorExplanations: {
      optionKey: string;
      explanation: string;
    }[];
  };
}
// Types for Pragmatic Analysis Tool
export interface PragmaticAlternative {
  type: string; // e.g., 'More Polite', 'More Formal'
  text: string;
  explanation: string;
}

export interface PragmaticAnalysisResult {
  formality: string;
  tone: string;
  intent: string;
  audience: string;
  alternatives: PragmaticAlternative[];
}

// Type for Dictionary
export interface DictionaryEntry {
  pronunciation?: string;
  turkishMeaning: string;
  definitions: string[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  exampleSentences: string[];
}

// Types for Visual Dictionary
export interface IdentifiedObject {
  englishName: string;
  turkishName: string;
}