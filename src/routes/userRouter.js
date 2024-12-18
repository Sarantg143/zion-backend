const express = require('express');
const {
    signupUser,
    loginUser,
    forgotPassword,
    editUser,
    getAllUsers,
    getUserById,
    deleteUser,
    addCourseToUser,
    markUserAnswers,
    getUsersByRole,
    validateAndUpdateMarks,
    getEnrolledCourses,
} = require('../controllers/userController'); 

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    const { data, isGoogleSignup } = req.body;
    try {
        const result = await signupUser(data, isGoogleSignup);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ success: false, message: 'Signup failed.', error: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { data, isGoogleLogin } = req.body;
    try {
        const result = await loginUser(data, isGoogleLogin);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
    }
});

// Forgot Password 
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await forgotPassword(email);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ success: false, message: 'Failed to send password reset email.', error: error.message });
    }
});

// Edit User 
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { updatedData, files } = req.body;
    try {
        const result = await editUser(userId, updatedData, files);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in editing user:', error);
        res.status(500).json({ success: false, message: 'Failed to edit user.', error: error.message });
    }
});

// Get All Users 
router.get('/', async (req, res) => {
    try {
        const result = await getAllUsers();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getting all users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users.', error: error.message });
    }
});

// Get User By ID 
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await getUserById(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getting user by ID:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user.', error: error.message });
    }
});

// Delete User
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await deleteUser(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
    }
});

// Add Course to User 
router.post('/:userId/add-course', async (req, res) => {
    const { userId } = req.params;
    const { courseId, courseTitle } = req.body;
    try {
        await addCourseToUser(userId, courseId, courseTitle);
        res.status(200).json({ success: true, message: 'Course added to user successfully.' });
    } catch (error) {
        console.error('Error in adding course to user:', error);
        res.status(500).json({ success: false, message: 'Failed to add course.', error: error.message });
    }
});

// Mark User Answers
router.post('/:userId/mark-answers', async (req, res) => {
    const { userId } = req.params;
    const { courseId, testType, answers, marks, totalMarks } = req.body;
    try {
        await markUserAnswers(userId, courseId, testType, answers, marks, totalMarks);
        res.status(200).json({ success: true, message: 'Answers marked successfully.' });
    } catch (error) {
        console.error('Error in marking user answers:', error);
        res.status(500).json({ success: false, message: 'Failed to mark answers.', error: error.message });
    }
});

// Get Users By Role 
router.get('/role/:role', async (req, res) => {
    const { role } = req.params;
    try {
        const users = await getUsersByRole(role);
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error in getting users by role:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users by role.', error: error.message });
    }
});

// Validate and Update Marks 
router.post('/:userId/validate-marks', async (req, res) => {
    const { userId } = req.params;
    const { courseId, testId, validatedAnswers } = req.body;
    try {
        const message = await validateAndUpdateMarks(userId, courseId, testId, validatedAnswers);
        res.status(200).json({ success: true, message });
    } catch (error) {
        console.error('Error in validating marks:', error);
        res.status(500).json({ success: false, message: 'Failed to validate marks.', error: error.message });
    }
});

// Get Enrolled Courses 
router.get('/:userId/enrolled-courses', async (req, res) => {
    const { userId } = req.params;
    try {
        const enrolledCourses = await getEnrolledCourses(userId);
        res.status(200).json({ success: true, enrolledCourses });
    } catch (error) {
        console.error('Error in fetching enrolled courses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses.', error: error.message });
    }
});

module.exports = router;
