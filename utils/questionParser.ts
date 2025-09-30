import { ParsedQuestion, ClozeTestResponse } from '../types';

export interface ParsedQuiz {
    context: string | null;
    questions: ParsedQuestion[];
}

export const parseGeneratedQuestions = (text: string): ParsedQuiz => {
    const questions: ParsedQuestion[] = [];
    let context: string | null = null;
    
    const normalizedText = text.trim().replace(/\r\n/g, '\n');

    // Split the entire text into potential blocks before each numbered question.
    // The regex `/(?=^\s*\d+\.)/m` splits the string but keeps the delimiter (the question number)
    // as part of the following string. This is a "positive lookahead".
    const potentialBlocks = normalizedText.split(/(?=^\s*\d+\.\s*)/m).filter(Boolean);
    
    // Check if the first block is context (i.e., it doesn't start with a number and a dot).
    if (potentialBlocks.length > 0 && !/^\s*\d+\./.test(potentialBlocks[0])) {
        context = potentialBlocks.shift()?.trim() || null;
    }
    
    // Now, potentialBlocks contains only strings that start with a question number.
    for (const block of potentialBlocks) {
        const cleanedBlock = block.trim();
        if (!cleanedBlock) continue;

        // 1. Find the correct answer and its location
        const answerMatch = cleanedBlock.match(/(?:Correct answer|Answer is|Correct option|Doğru cevap)\s*:?\s*([A-E])/i);
        const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : '';

        // 2. Create a version of the block for parsing that has the answer key and everything after it removed.
        // This prevents the answer from being included in the last option.
        const blockToParse = answerMatch ? cleanedBlock.substring(0, answerMatch.index).trim() : cleanedBlock;

        // Now, proceed with parsing `blockToParse`
        const optionsStartIndex = blockToParse.search(/\s*[A-E]\)/);
        if (optionsStartIndex === -1) continue;
        
        const questionTextWithNumber = blockToParse.substring(0, optionsStartIndex).trim();
        
        const questionText = questionTextWithNumber.replace(/^\d+\.\s*/, '');
        
        const optionsBlock = blockToParse.substring(optionsStartIndex);
        
        // This regex should now work correctly as the "Correct answer" part is gone.
        const optionRegex = /([A-E])\)(.*?)(?=\s*[A-E]\)|$)/gs;
        const options: { key: string; value: string }[] = [];
        let match;
        while ((match = optionRegex.exec(optionsBlock)) !== null) {
            const key = match[1].toUpperCase();
            const value = match[2].trim();
            if (value) {
                options.push({ key, value });
            }
        }

        // A valid question should have at least 2 options.
        if (options.length >= 2) {
             // For the analysis API call, we need to send the context along with EACH question.
             const fullTextForAnalysis = `${context ? context + '\n\n' : ''}${questionTextWithNumber}\n${options.map(o => `${o.key}) ${o.value}`).join('\n')}`;

            questions.push({
                id: questions.length,
                fullText: fullTextForAnalysis, // This is sent to the AI
                questionText: questionText, // This is for display in the generator UI
                options: options,
                correctAnswer: correctAnswer, // Can be empty
            });
        }
    }

    return { context, questions };
};


export const parseClozeTestJsonResponse = (data: ClozeTestResponse): ParsedQuiz => {
    const allQuestions: ParsedQuestion[] = [];
    const allPassages: string[] = [];
    let questionIdCounter = 0;

    if (!data.clozeTests) {
        return { context: null, questions: [] };
    }

    data.clozeTests.forEach((test, passageIndex) => {
        const passageTitle = data.clozeTests.length > 1 ? `--- Passage ${passageIndex + 1} ---\n` : '';
        allPassages.push(`${passageTitle}${test.passage}`);

        test.questions.sort((a, b) => a.blankNumber - b.blankNumber).forEach((q) => {
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];
            const correctIndex = q.options.findIndex(opt => opt.toLowerCase() === q.correctAnswer.toLowerCase());
            const correctAnswerLetter = correctIndex !== -1 ? optionLetters[correctIndex] : '';

            const question: ParsedQuestion = {
                id: questionIdCounter++,
                fullText: `${test.passage}\n\nQuestion for blank (${q.blankNumber}). Options:\n${q.options.map((o, i) => `${optionLetters[i]}) ${o}`).join('\n')}`,
                questionText: `Blank (${q.blankNumber}) - ${q.questionType}`,
                options: q.options.slice(0, 5).map((opt, i) => ({
                    key: optionLetters[i],
                    value: opt,
                })),
                correctAnswer: correctAnswerLetter,
            };
            allQuestions.push(question);
        });
    });
    
    return {
        context: allPassages.join('\n\n'),
        questions: allQuestions,
    };
}