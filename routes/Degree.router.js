const express = require('express');
const { db } = require('../firebase');
const Degree = require('../models/Degree.model');
const { uploadThumbnail, uploadFile } = require('../utils/fileUpload');  // Assuming file upload helper exists
const { createTestData } = require('../utils/testData');  // Assuming test creation helper exists
const multer = require("multer");

const degreeRouter = express.Router();

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

// Add a new degree
degreeRouter.post("/add", upload.fields([{ name: "thumbnail" }]), async (req, res) => {
    try {
      const { body, files } = req;
  
      // Validate degreeData
      if (!body.degreeData) {
        return res.status(400).json({ error: "Degree data is required." });
      }
  
      // Parse degreeData
      let degreeData;
      try {
        degreeData = JSON.parse(body.degreeData);
      } catch (error) {
        return res.status(400).json({ error: "Invalid degree data format." });
      }
  
      // Handle thumbnail upload
      let thumbnailUrl = null;
      if (files && files.thumbnail && files.thumbnail[0]) {
        thumbnailUrl = await uploadThumbnail(files.thumbnail[0]);
      }
  
      // Add thumbnail URL to degree data
      degreeData.thumbnail = thumbnailUrl;
  
      // Create a new Degree instance
      const newDegree = new Degree(degreeData);
  
      // Save degree to Firestore
      await db.collection("degrees").doc(newDegree.degreeId).set(newDegree);
  
      res.status(201).json({
        message: "Degree added successfully!",
        degreeId: newDegree.degreeId,
      });
    } catch (error) {
      console.error("Error adding degree:", error);
      res.status(500).json({ error: "Failed to add degree. Please try again later." });
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
