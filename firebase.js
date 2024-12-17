
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
   storageBucket: "zions-788b3.appspot.com", 
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket(); 

module.exports = { db, auth, bucket };


