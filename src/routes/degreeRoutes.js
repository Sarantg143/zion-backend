const express = require("express");
const { addDegree, getAllDegrees, getDegreeById,editDegree,deleteDegree,
    getDegreeByCourseId,getCourseById } = require('../controllers/degreeControllers');

const router = express.Router();

// Routes
router.post('/', async (req, res) => {
    try {
        const degreeData = req.body; 
        const degreeId = await addDegree(degreeData); 
        res.status(201).json({ message: 'Degree added successfully!', degreeId });
    } catch (error) {
        console.error('Error adding degree:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
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


router.get('/:degreeId', async (req, res) => {
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
  
  router.put('/:degreeId', async (req, res) => {
    try {
        const degreeId = req.params.degreeId;
        const updatedDegreeData = req.body;

        const updatedDegree = await editDegree(degreeId, updatedDegreeData);
        res.status(200).json({ message: 'Degree updated successfully!', updatedDegree });
    } catch (error) {
        console.error('Error updating degree:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:degreeId', async (req, res) => {
    try {
        const degreeId = req.params.degreeId;

        await deleteDegree(degreeId);
        res.status(200).json({ message: 'Degree deleted successfully!' });
    } catch (error) {
        console.error('Error deleting degree:', error.message);
        res.status(500).json({ error: error.message });
    }
});
  
  // Get degree by course ID
  router.get('/degrees/:courseId', async (req, res) => {
    try {
      const degree = await getDegreeByCourseId(req.params.courseId);
      res.status(200).json(degree);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });


router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const courseData = await getCourseById(courseId);
    res.json(courseData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;