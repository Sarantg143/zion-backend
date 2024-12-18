const { v4: uuidv4 } = require("uuid");

const createTestData = (testData) => {
  if (!testData) return null;

  const { title, timeLimit, type, questions = [] } = testData;

  const testObj = {
    testId: uuidv4(),
    title: title || null,
    timeLimit: timeLimit || null,
    type: type || null,
    totalMarks: 0,
    questions: questions.map((question) => {
      const questionData = {
        question: question.question || null,
        answerType: question.type || null,
      };

      if (question.type === "MCQ") {
        questionData.options = question.options || [];
        questionData.correctAnswer = question.correctAnswer || null;
        questionData.marks = question.marks || 1;
      } else if (question.type === "Typed") {
        questionData.answer = question.answer || "";
        questionData.marks = question.marks || 0;
      }
      return questionData;
    }),
    calculateTotalMarks() {
      let total = 0;
      this.questions.forEach((question) => {
        total += question.marks;
      });
      this.totalMarks = total;
    },
  };

  testObj.calculateTotalMarks();
  return testObj;
};

module.exports = { createTestData };
