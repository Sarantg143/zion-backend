const { v4: uuidv4 } = require("uuid");

class Degree {
  constructor(data) {
    this.degreeId = uuidv4();
    this.degreeTitle = data.degreeTitle || ""; // Required
    this.description = data.description || ""; // Optional
    this.thumbnail = data.thumbnail || null; // File URL (Optional)
    this.overviewPoints = data.overviewPoints || []; // Array of objects [{ title, description }]

    this.courses = data.courses
      ? data.courses.map((course) => this.createCourse(course))
      : []; // Array of courses

    this.createdAt = Date.now(); // Auto-generated timestamp
  }

  createCourse(courseData) {
    return {
      courseId: uuidv4(),
      courseTitle: courseData.courseTitle || "", // Required
      description: courseData.description || "", // Optional
      thumbnail: courseData.thumbnail || null, // File URL (Optional)
      price: courseData.price || null, // Optional

      finalTest: courseData.finalTest
        ? this.createTest(courseData.finalTest)
        : null, // Optional final test object

      chapters: courseData.chapters
        ? courseData.chapters.map((chapter) => this.createChapter(chapter))
        : [], // Array of chapters
    };
  }

  createChapter(chapterData) {
    return {
      chapterId: uuidv4(),
      chapterTitle: chapterData.chapterTitle || "", // Required
      description: chapterData.description || "", // Optional

      test: chapterData.test ? this.createTest(chapterData.test) : null, // Optional chapter test

      lessons: chapterData.lessons
        ? chapterData.lessons.map((lesson) => this.createLesson(lesson))
        : [], // Array of lessons
    };
  }

  createLesson(lessonData) {
    return {
      lessonId: uuidv4(),
      lessonTitle: lessonData.lessonTitle || "", // Required
      description: lessonData.description || "", // Optional
      file: lessonData.file || null, // File URL or Object (Optional)
    };
  }

  createTest(testData) {
    if (!testData) return null;

    const { title, timeLimit, type, questions = [] } = testData;

    const testObj = {
      testId: uuidv4(),
      title: title || null, // Required for the test
      timeLimit: timeLimit || null, // Optional time limit
      type: type || null, // MCQ, Typed, etc.

      totalMarks: 0, // Calculated below
      questions: questions.map((question) => {
        const questionData = {
          question: question.question || null, // Required question text
          answerType: question.type || null, // MCQ or Typed
        };

        if (question.type === "MCQ") {
          questionData.options = question.options || []; // Array of options
          questionData.correctAnswer = question.correctAnswer || null; // Correct answer
          questionData.marks = question.marks || 1; // Marks for MCQ question
        } else if (question.type === "Typed") {
          questionData.answer = question.answer || ""; // Answer for typed questions
          questionData.marks = question.marks || 0; // Marks for typed questions
        }
        return questionData;
      }),
    };

    // Calculate total marks for the test
    testObj.totalMarks = testObj.questions.reduce(
      (total, question) => total + (question.marks || 0),
      0
    );

    return testObj;
  }
}

module.exports = Degree;
