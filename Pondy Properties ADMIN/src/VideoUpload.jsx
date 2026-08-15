import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const VideoUpload = () => {
  const [videoPreview, setVideoPreview] = useState(null);

  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-sm-12">
          {/* Video Preview */}
          {videoPreview && (
            <div className="mb-4">
              <video
                src={videoPreview}
                controls
                className="w-100 rounded"
                style={{ maxHeight: "400px" }}
              />
            </div>
          )}

          {/* Upload Button */}
          <div className="text-center">
            <label htmlFor="video-upload" className="btn btn-primary">
              <i className="bi bi-camera-video me-2"></i>
              Upload Video
            </label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="form-control d-none"
              onChange={handleVideoChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
