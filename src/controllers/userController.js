const { collection, addDoc, getDocs, updateDoc, setDoc, doc, deleteDoc, query, where, getDoc, arrayUnion } = require('firebase/firestore');
const { getDownloadURL, ref, uploadBytes } = require('firebase/storage');
const bcrypt = require('bcryptjs');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } = require('firebase/auth');
const { v4: uuidv4 } = require('uuid');
const { db, storage } = require('../config/firebase');
const { getDegreeByCourseId } = require('./degreeControllers');


const auth = getAuth();


const uploadFile = async (file, folderName) => {
    const storageRef = ref(storage, `${folderName}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

// Sign up user (manual or Google sign-up)
const signupUser = async (data, isGoogleSignup = false) => {
    try {
        const usersRef = collection(db, 'users');
        let user;
        let firstName, lastName, email, username, password, profilePicture;

        if (isGoogleSignup) {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            user = result.user;

            firstName = user.displayName?.split(' ')[0] || '';
            lastName = user.displayName?.split(' ')[1] || '';
            email = user.email;
            username = user.email.split('@')[0];
            profilePicture = user.photoURL || '';
            password = null;
        } else {
            const usernameQuery = query(usersRef, where('username', '==', data.username));
            const usernameSnapshot = await getDocs(usernameQuery);

            const emailQuery = query(usersRef, where('email', '==', data.email));
            const emailSnapshot = await getDocs(emailQuery);

            if (!usernameSnapshot.empty) {
                return { success: false, message: 'Username already exists!' };
            }

            if (!emailSnapshot.empty) {
                return { success: false, message: 'Email already exists!' };
            }

            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            user = userCredential.user;

            firstName = data.firstName;
            lastName = data.lastName;
            email = data.email;
            username = data.username;
            profilePicture = '';
            password = await bcrypt.hash(data.password, 8);
        }

        if (isGoogleSignup) {
            const userQuery = query(usersRef, where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                return { success: true, message: 'User already exists!' };
            }
        }

        const userDoc = {
            firstName,
            lastName,
            email,
            username,
            password,
            profilePicture,
            profileBanner: '',
            mobileNo: '',
            maritalStatus: '',
            dob: '',
            gender: '',
            applyingFor: '',
            educationalQualification: '',
            theologicalQualification: '',
            presentAddress: '',
            ministryExperience: '',
            salvationExperience: '',
            signatureFile: '',
            passportPhotoFile: '',
            educationCertFile: '',
            purchasedCourse: [],
            role: 'client',
            joinedDate: new Date().toISOString(),
        };

        await setDoc(doc(usersRef, user.uid), userDoc);

        return { success: true, message: isGoogleSignup ? 'Google signup successful!' : 'Manual signup successful!' };
    } catch (error) {
        console.error('Error during signup:', error);
        return { success: false, message: 'Signup failed. Please try again.' };
    }
};

// Login user (manual or Google login)
const loginUser = async (data, isGoogleLogin = false) => {
    try {
        const usersRef = collection(db, 'users');
        let userDoc;

        if (isGoogleLogin) {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            const userQuery = query(usersRef, where('email', '==', googleUser.email));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.empty) {
                return { success: false, message: 'User not found. Please sign up first.' };
            }

            userDoc = userSnapshot.docs[0].data();

            return {
                success: true,
                message: 'Google login successful!',
                user: userDoc,
            };
        } else {
            const { emailOrUsername, password } = data;

            const loginQuery = emailOrUsername.includes('@')
                ? query(usersRef, where('email', '==', emailOrUsername))
                : query(usersRef, where('username', '==', emailOrUsername));

            const loginSnapshot = await getDocs(loginQuery);

            if (loginSnapshot.empty) {
                return { success: false, message: 'Invalid username or email.' };
            }

            userDoc = loginSnapshot.docs[0].data();

            const isPasswordValid = await bcrypt.compare(password, userDoc.password);
            if (!isPasswordValid) {
                return { success: false, message: 'Incorrect password.' };
            }

            await signInWithEmailAndPassword(auth, userDoc.email, password);

            return {
                success: true,
                message: 'Login successful!',
                user: userDoc,
            };
        }
    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
};


const forgotPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: 'Password reset email sent successfully. Please check your inbox.' };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, message: 'Failed to send password reset email. Please try again.' };
    }
};

 const editUser = async (userId, updatedData, files) => {
    try {
        const userDocRef = doc(db, 'users', userId);

        const updatedFields = {
            firstName: updatedData.firstName || '',
            lastName: updatedData.lastName || '',
            email: updatedData.email || '',
            mobileNo: updatedData.mobileNo || '',
            maritalStatus: updatedData.maritalStatus || '',
            dob: updatedData.dob || '',
            gender: updatedData.gender || '',
            applyingFor: updatedData.applyingFor || '',
            educationalQualification: updatedData.educationalQualification || '',
            theologicalQualification: updatedData.theologicalQualification || '',
            presentAddress: updatedData.presentAddress || '',
            ministryExperience: updatedData.ministryExperience || '',
            salvationExperience: updatedData.salvationExperience || '',
        };

        if (files.profilePicture) {
            const profilePictureUrl = await uploadFile(files.profilePicture, 'profilePictures');
            updatedFields.profilePicture = profilePictureUrl;
        }

        if (files.profileBanner) {
            const profileBannerUrl = await uploadFile(files.profileBanner, 'profileBanners');
            updatedFields.profileBanner = profileBannerUrl;
        }

        if (files.signatureFile) {
            const signatureFileUrl = await uploadFile(files.signatureFile, 'signatures');
            updatedFields.signatureFile = signatureFileUrl;
        }

        if (files.passportPhotoFile) {
            const passportPhotoFileUrl = await uploadFile(files.passportPhotoFile, 'passportPhotos');
            updatedFields.passportPhotoFile = passportPhotoFileUrl;
        }

        if (files.educationCertFile) {
            const educationCertFileUrl = await uploadFile(files.educationCertFile, 'educationCerts');
            updatedFields.educationCertFile = educationCertFileUrl;
        }

        await updateDoc(userDocRef, updatedFields);

        return { success: true, message: 'User profile updated successfully!' };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, message: 'Failed to update profile. Please try again.' };
    }
};

const getAllUsers = async () => {
    try {
        const usersRef = collection(db, 'users'); 
        const usersSnapshot = await getDocs(usersRef);  
        const usersList = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(), 
        }));

        return { success: true, users: usersList };
    } catch (error) {
        console.error('Error getting all users:', error);
        return { success: false, message: 'Failed to get users. Please try again.' };
    }
};

 const getUserById = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId); 
        const userDoc = await getDoc(userDocRef);  

        if (userDoc.exists()) {
            return { success: true, user: userDoc.data() };  
        } else {
            return { success: false, message: 'User not found.' };
        }
    } catch (error) {
        console.error('Error getting user by ID:', error);
        return { success: false, message: 'Failed to get user. Please try again.' };
    }
};

 const deleteUser = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await deleteDoc(userDocRef);  
        return { success: true, message: 'User deleted successfully.' };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: 'Failed to delete user. Please try again.' };
    }
};




const addCourseToUser = async (userId, courseId, courseTitle) => {
    try {
        const { degreeId, degreeTitle } = await getDegreeByCourseId(courseId);

        const purchasedCourse = {
            courseId,
            courseTitle,
            degreeId,
            degreeTitle,
            progress: 0,
            chapters: [], 
        };

        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            purchasedCourses: arrayUnion(purchasedCourse),
        });

        console.log('Course added to purchased courses successfully!');
    } catch (error) {
        console.error('Error adding course to user:', error);
        throw new Error('Failed to add course to user');
    }
};

const markUserAnswers = async (userId, courseId, testType, answers, marks, totalMarks) => {
    try {
        const userDocRef = doc(db, 'users', userId);

        const userSnap = await getDoc(userDocRef);
        const purchasedCourses = userSnap.data().purchasedCourses;

        const updatedCourses = purchasedCourses.map(course => {
            if (course.courseId === courseId) {
                if (testType === 'finalTest') {
                    course.finalTestMarks = marks;
                    course.progress = (marks / totalMarks) * 100;
                } else {
                    
                    course.chapters.forEach(chapter => {
                        chapter.lessons.forEach(lesson => {
                            if (lesson.test?.testId === testType) {
                                lesson.test.userMarks = marks;
                                lesson.test.progress = (marks / totalMarks) * 100; 
                            }
                        });
                    });
                }
            }
            return course;
        });

        await updateDoc(userDocRef, {
            purchasedCourses: updatedCourses,
        });

        console.log('User answers and progress updated successfully!');
    } catch (error) {
        console.error('Error marking user answers:', error);
        throw new Error('Failed to mark user answers');
    }
};


const getUsersByRole = async (role) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', role));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching users by role:', error);
        return [];
    }
};


const validateAndUpdateMarks = async (userId, courseId, testId, validatedAnswers) => {
    try {
        const userDocRef = doc(db, 'users', userId);

        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const userData = userSnap.data();
        const updatedCourses = userData.purchasedCourses.map(course => {
            if (course.courseId === courseId) {
                course.chapters.forEach(chapter => {
                    chapter.lessons.forEach(lesson => {
                        if (lesson.test?.testId === testId) {
                            lesson.test.questions.forEach((question, index) => {
                                const validatedAnswer = validatedAnswers[index];
                                
                                if (validatedAnswer) {
                                    
                                    question.marks = validatedAnswer.marks;
                                    question.validated = true; 
                                }
                            });

                            const totalMarks = lesson.test.questions.reduce((sum, question) => sum + question.marks, 0);
                            lesson.test.totalMarks = totalMarks;
                        }
                    });
                });
            }
            return course;
        });
        await updateDoc(userDocRef, {
            purchasedCourses: updatedCourses
        });

        console.log('Test marks updated successfully');
        return 'Test marks updated successfully';
    } catch (error) {
        console.error('Error updating test marks:', error);
        throw new Error('Failed to update test marks');
    }
};

const getEnrolledCourses = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            throw new Error(`No user found with ID: ${userId}`);
        }

        const userData = userDocSnap.data();
        const enrolledCourses = userData.purchasedCourses || [];

        return enrolledCourses;
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        throw new Error('Failed to fetch enrolled courses');
    }
};

// Export all user service functions
module.exports = {
    signupUser,
    loginUser,
    forgotPassword,
    uploadFile,
    editUser,
    getAllUsers,
    getUserById,
    deleteUser,
    addCourseToUser,
    markUserAnswers,
    getUsersByRole,
    validateAndUpdateMarks,
    getEnrolledCourses,
};
