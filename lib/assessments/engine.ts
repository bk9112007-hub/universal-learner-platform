import { z } from "zod";

import type { QuizQuestionType } from "@/types/domain";

export type QuizDraftQuestion = {
  prompt: string;
  questionType: QuizQuestionType;
  topic: string;
  points: number;
  options: string[];
  correctAnswer: string;
  correctAnswerKeywords: string[];
  explanation: string;
};

export type QuizDraft = {
  title: string;
  subject: string;
  description: string;
  topic: string;
  source: "manual" | "ai";
  questions: QuizDraftQuestion[];
};

export type QuizGradingResult = {
  score: number;
  aiScore: number;
  aiFeedback: string;
  weakTopics: string[];
  responses: Array<{
    questionId: string;
    responseText: string;
    isCorrect: boolean;
    scoreAwarded: number;
    aiFeedback: string;
  }>;
};

const quizQuestionSchema = z.object({
  prompt: z.string().min(5).max(300),
  questionType: z.enum(["multiple_choice", "short_answer", "true_false"]),
  topic: z.string().min(2).max(120),
  points: z.coerce.number().min(1).max(20),
  options: z.array(z.string().min(1).max(180)).default([]),
  correctAnswer: z.string().min(1).max(300),
  explanation: z.string().min(5).max(500).default(""),
  correctAnswerKeywords: z.array(z.string().min(1).max(100)).default([])
});

export const quizDraftSchema = z.object({
  title: z.string().min(3).max(120),
  subject: z.string().min(2).max(80),
  description: z.string().min(10).max(1200),
  topic: z.string().min(2).max(120),
  source: z.enum(["manual", "ai"]),
  questions: z.array(quizQuestionSchema).min(1).max(20)
});

function slugWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueKeywords(...values: string[]) {
  return Array.from(new Set(values.flatMap((value) => slugWords(value))));
}

export function parseQuizDraft(payload: string) {
  const parsed = JSON.parse(payload);
  return quizDraftSchema.parse(parsed);
}

export function buildAiQuizDraft(input: {
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: "foundational" | "intermediate" | "advanced";
}): QuizDraft {
  const baseKeywords = uniqueKeywords(input.subject, input.topic);
  const questionCount = Math.max(3, Math.min(input.questionCount, 8));
  const difficulties = {
    foundational: "identify the main concept",
    intermediate: "connect the concept to an example",
    advanced: "justify the concept in a real-world scenario"
  } as const;

  const questions: QuizDraftQuestion[] = Array.from({ length: questionCount }, (_, index) => {
    const questionNumber = index + 1;
    const focusWord = baseKeywords[index % Math.max(baseKeywords.length, 1)] ?? input.topic.toLowerCase();

    if (questionNumber % 3 === 0) {
      return {
        prompt: `In one or two sentences, ${difficulties[input.difficulty]} for ${titleCase(input.topic)} with a focus on ${focusWord}.`,
        questionType: "short_answer",
        topic: titleCase(focusWord),
        points: 5,
        options: [],
        correctAnswer: `${titleCase(input.topic)} should reference ${focusWord} and explain why it matters in ${input.subject}.`,
        correctAnswerKeywords: uniqueKeywords(input.topic, focusWord, input.subject).slice(0, 6),
        explanation: `Strong answers explain ${focusWord} clearly and connect it back to ${input.subject}.`
      };
    }

    if (questionNumber % 2 === 0) {
      return {
        prompt: `${titleCase(input.topic)}: True or false? A strong understanding of ${focusWord} helps learners ${difficulties[input.difficulty]}.`,
        questionType: "true_false",
        topic: titleCase(focusWord),
        points: 3,
        options: ["True", "False"],
        correctAnswer: "True",
        correctAnswerKeywords: ["true"],
        explanation: `${titleCase(focusWord)} supports deeper understanding when learners can apply it with confidence.`
      };
    }

    const correctOption = `It helps learners ${difficulties[input.difficulty]}.`;
    return {
      prompt: `Which option best describes why ${focusWord} matters in ${titleCase(input.topic)}?`,
      questionType: "multiple_choice",
      topic: titleCase(focusWord),
      points: 4,
      options: [
        correctOption,
        "It only matters when memorizing isolated facts.",
        "It replaces the need for practice and feedback.",
        "It should be ignored once a task becomes difficult."
      ],
      correctAnswer: correctOption,
      correctAnswerKeywords: uniqueKeywords(correctOption, focusWord).slice(0, 6),
      explanation: `${titleCase(focusWord)} matters because it helps learners apply the concept rather than memorize it in isolation.`
    };
  });

  return {
    title: `${titleCase(input.topic)} Quiz`,
    subject: input.subject,
    topic: titleCase(input.topic),
    description: `AI-assisted ${input.subject} quiz focused on ${input.topic}.`,
    source: "ai",
    questions
  };
}

function normalizeAnswer(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}

function gradeShortAnswer(question: QuizDraftQuestion, response: string) {
  const normalizedResponse = normalizeAnswer(response);
  const matches = question.correctAnswerKeywords.filter((keyword) => normalizedResponse.includes(keyword.toLowerCase()));
  const threshold = Math.max(1, Math.ceil(question.correctAnswerKeywords.length / 2));
  const isCorrect = matches.length >= threshold;
  const scoreAwarded = isCorrect ? question.points : Math.max(0, Number((question.points * (matches.length / Math.max(question.correctAnswerKeywords.length, 1))).toFixed(2)));

  return {
    isCorrect,
    scoreAwarded,
    aiFeedback: isCorrect
      ? `Strong response. You referenced ${matches.slice(0, 3).join(", ")} and connected the idea clearly.`
      : `This answer needs more detail. Try including key ideas like ${question.correctAnswerKeywords.slice(0, 3).join(", ")}.`
  };
}

function gradeChoiceQuestion(question: QuizDraftQuestion, response: string) {
  const isCorrect = normalizeAnswer(response) === normalizeAnswer(question.correctAnswer);

  return {
    isCorrect,
    scoreAwarded: isCorrect ? question.points : 0,
    aiFeedback: isCorrect ? "Correct. You selected the strongest answer." : `Not quite. ${question.explanation}`
  };
}

export function gradeQuizResponses(input: {
  questions: Array<QuizDraftQuestion & { id: string }>;
  responses: Record<string, string>;
}): QuizGradingResult {
  const totalPoints = input.questions.reduce((sum, question) => sum + question.points, 0);
  const gradedResponses = input.questions.map((question) => {
    const responseText = input.responses[question.id] ?? "";
    const grading =
      question.questionType === "short_answer"
        ? gradeShortAnswer(question, responseText)
        : gradeChoiceQuestion(question, responseText);

    return {
      questionId: question.id,
      responseText,
      isCorrect: grading.isCorrect,
      scoreAwarded: grading.scoreAwarded,
      aiFeedback: grading.aiFeedback,
      topic: question.topic
    };
  });

  const earnedPoints = gradedResponses.reduce((sum, response) => sum + response.scoreAwarded, 0);
  const aiScore = totalPoints > 0 ? Number(((earnedPoints / totalPoints) * 100).toFixed(1)) : 0;
  const weakTopics = Array.from(new Set(gradedResponses.filter((response) => !response.isCorrect).map((response) => response.topic)));

  const aiFeedback =
    weakTopics.length > 0
      ? `AI review complete. Focus next on ${weakTopics.slice(0, 3).join(", ")} to strengthen understanding before the teacher review.`
      : "AI review complete. Great work across the full quiz.";

  return {
    score: aiScore,
    aiScore,
    aiFeedback,
    weakTopics,
    responses: gradedResponses.map(({ topic: _topic, ...response }) => response)
  };
}
