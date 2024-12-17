const { Router } = require('express');
const { auth, db, storage } = require('../firebase.js');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { collection, addDoc, getDocs, doc, getDoc } = require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const Degree = require("../models/Degree.model.js");

// const { Router } = require('express');
//const { db } = require('../firebase'); // Assuming Firebase setup
// const { collection, addDoc } = require('firebase/firestore');
const { uploadFile, uploadThumbnail } = require('../utils/fileUpload');
const { createTestData } = require('../utils/testData');
// const Degree = require('../models/Degree.model');

const degreeRouter = Router();

degreeRouter.post('/', async (req, res) => {
    try {
        const {
            degreeTitle,
            description,
            overviewPoints = [],
            courseThumbnail,
            degreeThumbnail,
            finalTest,
            test,
        } = req.body;

        // Upload thumbnails
        const degreeThumbnailUrl = degreeThumbnail ? await uploadThumbnail(degreeThumbnail) : null;
        const courseThumbnailUrl = courseThumbnail ? await uploadFile(courseThumbnail) : null;

        // Generate test data
        const finalTestData = createTestData(finalTest);
        const testData = createTestData(test);

        // Prepare degree data
        const degreeData = new Degree({
            degreeTitle,
            description,
            thumbnail: degreeThumbnailUrl,
            overviewPoints,
            courses: [
                {
                    courseTitle: 'Example Course',
                    thumbnail: courseThumbnailUrl,
                    finalTest: finalTestData,
                    chapters: [
                        {
                            chapterTitle: 'Chapter 1',
                            test: testData,
                            lessons: [
                                {
                                    lessonTitle: 'Lesson 1',
                                    file: {
                                        url: 'https://example.com/file.pdf',
                                        type: 'document',
                                        name: 'file.pdf',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        // Save to Firestore
        const degreeRef = await addDoc(collection(db, 'degrees'), degreeData);

        res.status(201).json({
            message: 'Degree added successfully!',
            degreeId: degreeRef.id,
            degreeData,
        });
    } catch (error) {
        console.error('Error adding degree:', error);
        res.status(500).json({ error: 'Failed to add degree' });
    }
});



degreeRouter.get('/', async (req, res) => {
    try {
      const degreesSnapshot = await getDocs(collection(db, 'degrees'));
      const degrees = degreesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      res.status(200).json(degrees);
    } catch (error) {
      console.error('Error fetching degrees:', error);
      res.status(500).json({ error: 'Failed to fetch degrees' });
    }
  });


degreeRouter.get('/:degreeId', async (req, res) => {
    try {
        const { degreeId } = req.params;

        const degreeRef = doc(db, 'degrees', degreeId);
        const degreeSnapshot = await getDoc(degreeRef);

        if (!degreeSnapshot.exists()) {
            return res.status(404).json({ message: 'Degree not found' });
        }

        res.status(200).json({
            message: 'Degree fetched successfully',
            degree: { id: degreeSnapshot.id, ...degreeSnapshot.data() },
        });
    } catch (error) {
        console.error('Error fetching degree by ID:', error);
        res.status(500).json({ error: 'Failed to fetch degree by ID' });
    }
});

degreeRouter.get('/:degreeId/:courseId', async (req, res) => {
    try {
        const { degreeId, courseId } = req.params;

        const degreeRef = doc(db, 'degrees', degreeId);
        const degreeSnapshot = await getDoc(degreeRef);

        if (!degreeSnapshot.exists()) {
            return res.status(404).json({ message: 'Degree not found' });
        }

        const degreeData = degreeSnapshot.data();
        const course = degreeData.courses.find(course => course.courseId === courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json({
            message: 'Course fetched successfully',
            course,
        });
    } catch (error) {
        console.error('Error fetching course by ID:', error);
        res.status(500).json({ error: 'Failed to fetch course by ID' });
    }
});


module.exports = degreeRouter;
