
const { db, storage } = require('../config/firebase');
const {collection,addDoc,getDocs,updateDoc,setDoc,doc,deleteDoc,query,where,getDoc,} = require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const { getDownloadURL, ref, uploadBytes } = require('firebase/storage');
const { getMediaDuration } = require('./mediaUtils');

const DEGREES_COLLECTION = 'degrees';
const SUPPORTED_FILE_FOLDERS = {
    video: 'videos',
    audio: 'audios',
    image: 'images',
    document: 'documents',
    pdf: 'documents',
    ppt: 'presentations',
};

const checkRequiredFields = (degreeData) => {
  if (!degreeData.degreeTitle) { 
      throw new Error('Degree title is required');
  }

  const hasValidCourses = degreeData.courses.every((course) => {
      if (!course.courseTitle) { 
          throw new Error('Course title is required');
      }

      const hasValidChapters = course.chapters.every((chapter) => {
          if (!chapter.chapterTitle) { 
              throw new Error('Chapter title is required');
          }

          const hasValidLessons = chapter.lessons.every((lesson) => {
              if (!lesson.lessonTitle) { 
                  throw new Error('Lesson title is required');
              }
              return true;
          });

          return hasValidLessons;
      });

      return hasValidChapters;
  });

  return hasValidCourses;
};


const uploadFile = async (file) => {
    try {
        const fileType = file.type.split('/')[0];
        const folder = SUPPORTED_FILE_FOLDERS[fileType];
        if (!folder) throw new Error(`Unsupported file type: ${file.type}`);

        const fileRef = ref(storage, `${folder}/${uuidv4()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        let duration = null;
        if (fileType === 'video' || fileType === 'audio') {
            duration = await getMediaDuration(file);
        }

        return {
            url: fileUrl,
            type: fileType,
            name: file.name,
            duration,
        };
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw new Error('File upload failed');
    }
};

const uploadThumbnail = async (file) => {
    try {
        const fileRef = ref(storage, `thumbnails/${uuidv4()}_${file.name}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    } catch (error) {
        console.error('Error uploading thumbnail:', error.message);
        throw new Error('Thumbnail upload failed');
    }
};

const createTestObject = (testData) => {
    const questions = testData.questions.map((question) => {
        const questionData = {
            question: question.question || null,
            answerType: question.type || null,
        };

        if (question.type === 'MCQ') {
            questionData.options = question.options || [];
            questionData.correctAnswer = question.correctAnswer || null;
            questionData.marks = question.marks || 1;
        } else if (question.type === 'Typed') {
            questionData.answer = question.answer || '';
            questionData.marks = question.marks || 0;
        }

        return questionData;
    });

    return {
        testId: uuidv4(),
        title: testData.title || null,
        timeLimit: testData.timeLimit || null,
        type: testData.type || null,
        questions,
        totalMarks: questions.reduce((total, q) => total + (q.marks || 0), 0),
    };
};

const addDegree = async (degreeData) => {
  try {
      checkRequiredFields(degreeData);

      const { degreeTitle, description, thumbnail, overviewPoints, courses } = degreeData; 
      const degreeThumbnailUrl = thumbnail ? await uploadThumbnail(thumbnail) : null;

      const formattedCourses = await Promise.all(
          courses.map(async (course) => {
              const courseThumbnailUrl = course.thumbnail ? await uploadThumbnail(course.thumbnail) : null;

              const formattedChapters = await Promise.all(
                  course.chapters.map(async (chapter) => {
                      const formattedLessons = await Promise.all(
                          chapter.lessons.map(async (lesson) => {
                            const lessonFileMetadata = lesson.file 
                            ? await uploadFile(lesson.file) 
                            : null;
                              return {
                                  lessonId: uuidv4(),
                                  lessonTitle: lesson.lessonTitle, 
                                  file: lessonFileMetadata,
                              };
                          })
                      );

                      const test = chapter.test ? createTestObject(chapter.test) : null;

                      return {
                          chapterId: uuidv4(),
                          chapterTitle: chapter.chapterTitle, 
                          description: chapter.description || null,
                          test: test, 
                          lessons: formattedLessons,
                      };
                  })
              );

              return {
                  courseId: uuidv4(),
                  courseTitle: course.courseTitle,
                  description: course.description || null,
                  thumbnail: courseThumbnailUrl || null,
                  price: course.price || null,
                  chapters: formattedChapters,
                  finalTest: course.finalTest ? createTestObject(course.finalTest) : null,
                  overviewPoints: course.overviewPoints
                      ? course.overviewPoints.map((point) => ({
                            title: point.title || null,
                            description: point.description || null,
                        }))
                      : [],
              };
          })
      );

      const degree = {
          degreeId: uuidv4(),
          degreeTitle: degreeTitle,
          description: description || null,
          thumbnail: degreeThumbnailUrl || null,
          overviewPoints: overviewPoints
              ? overviewPoints.map((point) => ({
                    title: point.title || null,
                    description: point.description || null,
                }))
              : [],
          courses: formattedCourses,
          createdAt: Date.now(),
      };

      await addDoc(collection(db, DEGREES_COLLECTION), degree);
      console.log('Degree added successfully!');
      return degree.degreeId;
  } catch (error) {
      console.error('Error adding degree:', error.message);
      throw new Error(error.message);
  }
};


const getAllDegrees = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, DEGREES_COLLECTION));
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error getting degrees:', error.message);
        throw new Error('Failed to fetch degrees');
    }
};

const getDegreeById = async (degreeId) => {
    try {
      const q = query(collection(db, 'degrees'), where('degreeId', '==', degreeId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        throw new Error(`No degree found with degreeId: ${degreeId}`);
      }
  
      const degree = querySnapshot.docs[0].data();
      return degree;
    } catch (error) {
      console.error('Error fetching degree by degreeId:', error.message);
      return null;
    }
  };

  const deepRemoveUndefined = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => deepRemoveUndefined(item)); 
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce((acc, key) => {
        // Keep the ID fields and remove undefined fields
        if (key.includes('Id') || obj[key] !== undefined) {
          acc[key] = deepRemoveUndefined(obj[key]); // Keep the field if it has an ID or value
        }
        return acc;
      }, {});
    }
    return obj;
  };
  
  const editDegree = async (degreeId, updatedDegreeData) => {
    try {
      checkRequiredFields(updatedDegreeData);
  
      const q = query(collection(db, DEGREES_COLLECTION), where('degreeId', '==', degreeId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        throw new Error(`No degree found with degreeId: ${degreeId}`);
      }
  
      const degreeDocRef = doc(db, DEGREES_COLLECTION, querySnapshot.docs[0].id);
  
      const { degreeTitle, description, thumbnail, overviewPoints = [], courses = [] } = updatedDegreeData;
  
      const degreeThumbnailUrl = thumbnail ? await uploadThumbnail(thumbnail) : null;
  
      const formattedOverviewPoints = overviewPoints.map((point) => ({
        title: point.title || null,
        description: point.description || null,
      }));
  
      const formattedCourses = await Promise.all(
        courses.map(async (course) => {
          const courseThumbnailUrl = course.thumbnail ? await uploadThumbnail(course.thumbnail) : null;
          const formattedChapters = await Promise.all(
            (course.chapters || []).map(async (chapter) => {
              const formattedLessons = await Promise.all(
                (chapter.lessons || []).map(async (lesson) => {
                  const lessonFileMetadata = lesson.file ? await uploadFile(lesson.file) : null;
                  return {
                    lessonId: lesson.lessonId,  // Keep the lesson ID
                    lessonTitle: lesson.lessonTitle || null,
                    file: lessonFileMetadata,
                  };
                })
              );
  
              const test = chapter.test ? createTestObject(chapter.test) : null;
  
              return {
                chapterId: chapter.chapterId,  // Keep the chapter ID
                chapterTitle: chapter.chapterTitle || null,
                description: chapter.description || null,
                test: test,
                lessons: formattedLessons,
              };
            })
          );
  
          return {
            courseId: course.courseId,  // Keep the course ID
            courseTitle: course.courseTitle || null,
            description: course.description || null,
            thumbnail: courseThumbnailUrl || null,
            price: course.price || null,
            chapters: formattedChapters,
            finalTest: course.finalTest ? createTestObject(course.finalTest) : null,
            overviewPoints: (course.overviewPoints || []).map((point) => ({
              title: point.title || null,
              description: point.description || null,
            })),
          };
        })
      );
  
      const updatedDegree = {
        degreeId: degreeId,  // Keep the degree ID unchanged
        degreeTitle: degreeTitle || null,
        description: description || null,
        thumbnail: degreeThumbnailUrl || null,
        overviewPoints: formattedOverviewPoints,
        courses: formattedCourses,
        updatedAt: Date.now(),
      };
  
      const finalUpdatedDegree = deepRemoveUndefined(updatedDegree);  // Remove undefined fields but preserve IDs
  
      await updateDoc(degreeDocRef, finalUpdatedDegree);
      console.log('Degree updated successfully!');
      return finalUpdatedDegree;
    } catch (error) {
      console.error('Error updating degree:', error.message);
      throw new Error('Degree update failed');
    }
  };
  
    
  
  
  
  

const deleteDegree = async (degreeId) => {
    try {
      const q = query(collection(db, DEGREES_COLLECTION), where('degreeId', '==', degreeId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        throw new Error(`No degree found with degreeId: ${degreeId}`);
      }
  
      const degreeDocRef = doc(db, DEGREES_COLLECTION, querySnapshot.docs[0].id);

      await deleteDoc(degreeDocRef);
      console.log('Degree deleted successfully!');
    } catch (error) {
      console.error('Error deleting degree:', error.message);
      throw new Error('Degree deletion failed');
    }
  };
  

  const getDegreeByCourseId = async (courseId) => {
    try {
       
        const degreesSnapshot = await getDocs(collection(db, DEGREES_COLLECTION));

        if (degreesSnapshot.empty) {
            throw new Error("No degrees found in the database");
        }
        for (const degreeDoc of degreesSnapshot.docs) {
            const degreeData = degreeDoc.data();
            const courseExists = degreeData.courses.some((course) => course.courseId === courseId);

            if (courseExists) {
                return {
                    degreeId: degreeDoc.id, 
                    ...degreeData,
                };
            }
        }
        throw new Error(`No degree found for course ID: ${courseId}`);
    } catch (error) {
        console.error("Error getting degree by course ID:", error.message);
        throw new Error("Failed to fetch degree by course ID");
    }
};

const getCourseById = async (courseId) => {
    try {
      const degreesSnapshot = await getDocs(collection(db, "degrees"));
  
      if (degreesSnapshot.empty) {
        throw new Error("No degrees found in the database");
      }
  
      for (const degreeDoc of degreesSnapshot.docs) {
        const degreeData = degreeDoc.data();
        console.log("Inspecting degree:", degreeData.degreeId);
  
        const course = degreeData.courses.find((c) => c.courseId === courseId);
  
        if (course) {
          console.log("Course found:", course);
          return {
            degreeId: degreeDoc.id,
            ...course, 
          };
        }
      }
      throw new Error(`Course with ID ${courseId} not found`);
    } catch (error) {
      console.error("Error fetching course by ID:", error.message);
      throw new Error("Failed to fetch course by ID");
    }
  };

module.exports = {
    uploadFile,
    uploadThumbnail,
    createTestObject,
    addDegree,
    getAllDegrees,
    getDegreeById,
    editDegree,
    deleteDegree,
    getDegreeByCourseId,
    getCourseById
};