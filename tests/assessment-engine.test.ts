import { describe, expect, it } from "vitest";

import { buildAiQuizDraft, gradeQuizResponses } from "@/lib/assessments/engine";

describe("assessment engine", () => {
  it("builds an AI quiz draft with the requested number of questions", () => {
    const draft = buildAiQuizDraft({
      subject: "Science",
      topic: "Photosynthesis",
      difficulty: "intermediate",
      questionCount: 5
    });

    expect(draft.source).toBe("ai");
    expect(draft.questions).toHaveLength(5);
  });

  it("grades quiz responses and returns weak topics", () => {
    const result = gradeQuizResponses({
      questions: [
        {
          id: "q1",
          prompt: "Which answer is best?",
          questionType: "multiple_choice",
          topic: "Cells",
          points: 4,
          options: ["Correct", "Wrong"],
          correctAnswer: "Correct",
          correctAnswerKeywords: ["correct"],
          explanation: "Correct is the best answer."
        },
        {
          id: "q2",
          prompt: "Short answer",
          questionType: "short_answer",
          topic: "Energy",
          points: 4,
          options: [],
          correctAnswer: "Use energy vocabulary",
          correctAnswerKeywords: ["energy", "sunlight", "glucose"],
          explanation: "Reference energy transfer."
        }
      ],
      responses: {
        q1: "Correct",
        q2: "Plants need water"
      }
    });

    expect(result.aiScore).toBeLessThan(100);
    expect(result.weakTopics).toContain("Energy");
    expect(result.responses).toHaveLength(2);
  });
});
