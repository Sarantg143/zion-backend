class User {
  constructor(data) {
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.username = data.username || '';
    this.password = data.password || ''; 
    this.profilePicture = data.profilePicture || '';
    this.profileBanner = '';
    this.mobileNo = '';
    this.maritalStatus = '';
    this.dob = '';
    this.gender = '';
    this.applyingFor = '';
    this.educationalQualification = '';
    this.theologicalQualification = '';
    this.presentAddress = '';
    this.ministryExperience = '';
    this.salvationExperience = '';
    this.signatureFile = '';
    this.passportPhotoFile = '';
    this.educationCertFile = '';
    this.purchasedCourse = [];
    this.role = 'client';
    this.joinedDate = new Date().toISOString();
    this.token = data.token || ''; 
  }

  // Convert instance to plain object
  toPlainObject() {
    return { ...this }; // Spread the instance properties into a plain object
  }
}

module.exports = User;
