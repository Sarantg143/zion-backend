const { Router } = require('express');
const { auth, db } = require("../firebase.js");
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, sendPasswordResetEmail } = require("firebase/auth");
const { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs } = require("firebase/firestore");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const User = require("../models/User.model.js");
const { v4: uuidv4} = require("uuid");
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const userRouter = Router();

userRouter.post("/signup", async (req, res) => {
  const { firstName, lastName, email, username, password, googleIdToken } = req.body;

  try {
    // Google Signup
    if (googleIdToken) {
      const decodedToken = await admin.auth().verifyIdToken(googleIdToken);
      const { uid, email, name, picture } = decodedToken;
      const emailSnapshot = await db.collection('users').where('email', '==', email).get();
      if (!emailSnapshot.empty) {
        return res.status(400).json({ error: "Email already exists." });
      }

      const usernameSnapshot = await db.collection('users').where('username', '==', email.split('@')[0]).get();
      if (!usernameSnapshot.empty) {
        return res.status(400).json({ error: "Username already exists." });
      }

      const userRef = db.collection("users").doc(uid);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        const newUser = new User({
          firstName: name?.split(" ")[0] || "",
          lastName: name?.split(" ")[1] || "",
          email: email,
          username: email.split('@')[0], // Using email prefix as username
          profilePicture: picture || "",
          token: googleIdToken, 
        });

        const plainUser = { ...newUser };

        await userRef.set(plainUser);
      }

      return res.status(201).json({
        message: "Google Signup Successful",
        userId: uid,
      });

    } else {
      // Manual Signup

      if (!firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({ error: "All fields are required for manual signup." });
      }

      const emailSnapshot = await db.collection('users').where('email', '==', email).get();
      if (!emailSnapshot.empty) {
        return res.status(400).json({ error: "Email already exists." });
      }

      const usernameSnapshot = await db.collection('users').where('username', '==', username).get();
      if (!usernameSnapshot.empty) {
        return res.status(400).json({ error: "Username already exists." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const userId = uuidv4();

      const newUser = new User({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword, 
        token: "", 
      });

      const plainUser = { ...newUser };

      await db.collection("users").doc(userId).set(plainUser);

      res.status(201).json({
        message: "Manual Signup Successful",
        userId,
      });
    }
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

userRouter.post("/login", async (req, res) => {
  const { emailOrUsername, password, googleIdToken } = req.body;

  try {
    
    if (googleIdToken) {
      const decodedToken = await admin.auth().verifyIdToken(googleIdToken);
      const { uid, email, name, picture } = decodedToken;

      const userRef = db.collection('users').doc(uid);
      const userSnapshot = await userRef.get();

      if (userSnapshot.exists) {
        return res.status(200).json({
          message: "Google Login Successful",
          userId: uid,
          userData: userSnapshot.data(),
        });
      } else {
        return res.status(400).json({ error: "User not found." });
      }
    } else {

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: "Email/Username and Password are required." });
      }

      let userSnapshot;
      if (emailOrUsername.includes('@')) {
        // Email login
        userSnapshot = await db.collection('users').where('email', '==', emailOrUsername).get();
      } else {
        // Username login
        userSnapshot = await db.collection('users').where('username', '==', emailOrUsername).get();
      }

      if (userSnapshot.empty) {
        return res.status(400).json({ error: "User not found." });
      }

      const userDoc = userSnapshot.docs[0];
      const user = userDoc.data();

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res.status(400).json({ error: "Invalid password." });
      }

      return res.status(200).json({
        message: "Login Successful",
        userId: userDoc.id,
        userData: user,
      });
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required to reset the password.' });
    }
    const userSnapshot = await db.collection('users').where('email', '==', email).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'No user found with this email.' });
    }

    const userData = userSnapshot.docs[0].data();

    if (userData.token) {
      return res.status(400).json({
        error: 'This account is linked with Google. Please reset your password through your Google account settings.',
      });
    }
    await auth.sendPasswordResetEmail(email);

    return res.status(200).json({
      message: 'Password reset email sent successfully. Check your email to reset your password.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    return res.status(500).json({ error: 'Failed to send password reset email. Please try again later.' });
  }
});

userRouter.get('/', async (req, res) => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'No users found.' });
    }

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get All Users Error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch users. Please try again later.' });
  }
});

userRouter.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userRef = db.collection('users').doc(id);
    const docSnapshot = await userRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = { id: docSnapshot.id, ...docSnapshot.data() };

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get User by ID Error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch user. Please try again later.' });
  }
});
  

  const uploadUserFile = async (file, folderName) => {
    const fileName = `${Date.now()}_${file.originalname || file.name}`;
    const storageRef = ref(storage, `${folderName}/${fileName}`);
    await uploadBytes(storageRef, file.buffer || file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };
  
  
  userRouter.put('/:id', async (req, res) => {
    const { id } = req.params; // User ID from URL params
    const updates = { ...req.body }; // Fields from the request body
    const files = req.files || {}; // Files from the request
  
    try {
      const userRef = db.collection('users').doc(id); // Get user reference
      const userDoc = await userRef.get(); // Fetch the user document
  
      // Ensure the user exists
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const existingUserData = userDoc.data(); // Get the current user data
  
      // Handle file uploads and add URLs to updates dynamically
      if (files.profilePicture) {
        const profilePictureUrl = await uploadUserFile(files.profilePicture, 'profilePictures');
        updates.profilePicture = profilePictureUrl;
      }
  
      if (files.profileBanner) {
        const profileBannerUrl = await uploadUserFile(files.profileBanner, 'profileBanners');
        updates.profileBanner = profileBannerUrl;
      }
  
      if (files.signatureFile) {
        const signatureFileUrl = await uploadUserFile(files.signatureFile, 'signatures');
        updates.signatureFile = signatureFileUrl;
      }
  
      if (files.educationCertFile) {
        const educationCertFileUrl = await uploadUserFile(files.educationCertFile, 'educationCertificates');
        updates.educationCertFile = educationCertFileUrl;
      }
  
      // Remove empty fields from updates object
      for (const key in updates) {
        if (!updates[key]) {
          delete updates[key];
        }
      }
  
      // If updates are empty, send a response indicating no changes
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update.' });
      }
  
      // Update the Firestore document with the new data
      await userRef.update({
        ...existingUserData, // Keep existing fields that are not updated
        ...updates, // Apply updates from request
      });
  
      return res.status(200).json({ message: 'User updated successfully!', updates });
    } catch (error) {
      console.error('Edit User Error:', error.message);
      return res.status(500).json({ error: 'Failed to update user. Please try again later.' });
    }
  });
  




  userRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const userRef = doc(db, "users", id);
      const userSnapshot = await getDoc(userRef);
  
      if (!userSnapshot.exists()) {
        return res.status(404).json({ error: "User not found in Firestore." });
      }
  
      await deleteDoc(userRef);
  
      const user = await auth.getUser(id); 
      if (user) {
        await deleteUser(user); 
      }
  
      return res.json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Delete User Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });



  userRouter.post('/purchase/:degreeId/:courseId', async (req, res) => {
    try {
        const { userId } = req.body; 
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

        const userRef = doc(db, 'users', userId); 
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userSnapshot.data();

        // Check user already purchased the course
        const alreadyPurchased = userData.purchasedCourses.some(
            (purchase) => purchase.courseId === courseId
        );

        if (alreadyPurchased) {
            return res.status(400).json({ message: 'You have already purchased this course' });
        }
        const purchaseDetails = {
            degreeId: degreeId,
            degreeTitle: degreeData.degreeTitle, 
            courseId: courseId,
            courseTitle: course.courseTitle, 
        };

        const updatedPurchasedCourses = [...userData.purchasedCourses, purchaseDetails];
        await updateDoc(userRef, {
            purchasedCourses: updatedPurchasedCourses,
        });

        res.status(200).json({
            message: 'Course purchased successfully',
            purchasedCourses: updatedPurchasedCourses,
        });
    } catch (error) {
        console.error('Error purchasing course:', error);
        res.status(500).json({ error: 'Failed to purchase course' });
    }
});

  module.exports = userRouter;
