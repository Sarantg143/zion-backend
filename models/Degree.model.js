const { v4: uuidv4 } = require('uuid');

class Degree {
    constructor(degreeData) {
        this.degreeId = uuidv4();
        this.degreeTitle = degreeData.degreeTitle || "";
        this.description = degreeData.description || "";
        this.thumbnail = degreeData.thumbnail || null;
        this.overviewPoints = degreeData.overviewPoints
            ? degreeData.overviewPoints.map((point) => ({
                  title: point.title || null,
                  description: point.description || null,
              }))
            : [];
        this.courses = degreeData.courses
            ? degreeData.courses.map((course) => this.createCourse(course))
            : [];
        this.createdAt = Date.now();
    }

    createCourse(courseData) {
        return {
            courseId: uuidv4(),
            courseTitle: courseData.courseTitle || "",
            description: courseData.description || "",
            thumbnail: courseData.thumbnail || null,
            price: courseData.price || null,
            finalTest: courseData.finalTest || null,
            chapters: courseData.chapters
                ? courseData.chapters.map((chapter) => this.createChapter(chapter))
                : [],
        };
    }

    createChapter(chapterData) {
        return {
            chapterId: uuidv4(),
            chapterTitle: chapterData.chapterTitle || "",
            description: chapterData.description || null,
            test: chapterData.test || null,
            lessons: chapterData.lessons
                ? chapterData.lessons.map((lesson) => this.createLesson(lesson))
                : [],
        };
    }

    createLesson(lessonData) {
        return {
            lessonId: uuidv4(),
            lessonTitle: lessonData.lessonTitle || "",
            file: lessonData.file || {},
        };
    }
}

module.exports = Degree;
