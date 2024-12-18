const express = require("express");
// import { addDegree, getAllDegrees, getDegreeById } from '../controllers/degreeController';
const { addDegree, getAllDegrees, getDegreeById,
    editDegree,
    deleteDegree,
    getDegreeByCourseId,getCourseById } = require('../controllers/degreeControllers');
const multer = require("multer");

const upload = multer(); // Multer for handling file uploads
const router = express.Router();

// Routes
router.post('/add-degree', async (req, res) => {
    try {
        const degreeData = req.body; // Expecting JSON body data from the client
        const degreeId = await addDegree(degreeData); // Call the addDegree function
        res.status(201).json({ message: 'Degree added successfully!', degreeId });
    } catch (error) {
        console.error('Error adding degree:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/degrees', async (req, res) => {
    console.log('Request received for /api/degrees');
    try {
      const degrees = await getAllDegrees();
      console.log('Degrees fetched successfully:', degrees);
      res.status(200).json(degrees);
    } catch (error) {
      console.error('Error fetching degrees:', error.message);

      res.status(500).json({ error: 'Failed to fetch degrees' });
    }
  });

// Route to fetch degree by degreeId
router.get('/degrees/:degreeId', async (req, res) => {
    try {
      const { degreeId } = req.params;
      const degree = await getDegreeById(degreeId);
      if (!degree) {
        return res.status(404).json({ error: 'Degree not found' });
      }
      res.status(200).json(degree);
    } catch (error) {
      console.error('Error fetching degree:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
  
  
  // Edit a degree
  router.put('/degrees/:id', async (req, res) => {
    try {
      const updatedDegree = await editDegree(req.params.id, req.body);
      res.status(200).json({ message: 'Degree updated successfully', updatedDegree });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Delete a degree
  router.delete('/degrees/:id', async (req, res) => {
    try {
      await deleteDegree(req.params.id);
      res.status(200).json({ message: 'Degree deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get degree by course ID
  router.get('/degrees/course/:courseId', async (req, res) => {
    try {
      const degree = await getDegreeByCourseId(req.params.courseId);
      res.status(200).json(degree);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });


router.get('/courses/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const courseData = await getCourseById(courseId);
    res.json(courseData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;