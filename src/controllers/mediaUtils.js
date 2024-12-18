const getMediaDuration = (file) => {
    return new Promise((resolve, reject) => {
      const mediaElement = document.createElement(
        file.type.startsWith('video') ? 'video' : 'audio'
      );
      mediaElement.preload = 'metadata';
      mediaElement.src = URL.createObjectURL(file);
      mediaElement.onloadedmetadata = () => {
        resolve(mediaElement.duration); 
        URL.revokeObjectURL(mediaElement.src); 
      };
      mediaElement.onerror = () => {
        reject('Unable to retrieve media duration.');
      };
    });
  };
  
  module.exports = {getMediaDuration};