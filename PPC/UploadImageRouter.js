const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UploadImages = require('./UploadImageModel'); // Adjust path as needed
const ImageClickGroom = require('./ImageClickModel')

// Create 'uploads' directory if not exists
const uploadDirectory = 'uploads/';
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const fileName = Date.now() + '-' + Math.round(Math.random() * 1e9) + fileExtension;
        cb(null, fileName);
    }
});

// Multer config (limit 15 files, max size 50MB each)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 50
    },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|mp4|avi|mov/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only image/video files are allowed!'), false);
        }
    }
});

// 🔸 POST: Upload up to 15 images
router.post('/uploadimage', upload.array('images', 50), async (req, res) => {
    try {
        const imagePaths = req.files.map(file => file.path);
        const uploadEntry = new UploadImages({
            images: imagePaths
        });
        await uploadEntry.save();
        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadEntry
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Image upload failed',
            error: error.message
        });
    }
});

// 🔹 GET: Retrieve all uploaded images
router.get('/get-uploadimages', async (req, res) => {
    try {
        const allImages = await UploadImages.find().sort({ uploadDate: -1 });
        res.status(200).json({
            success: true,
            data: allImages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch images',
            error: error.message
        });
    }
});


// 🔸 PUT: Edit uploaded images (replace old with new)
router.put('/edit-uploadimage/:id', upload.array('images', 15), async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await UploadImages.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Upload not found' });
        }

        // Remove old files from filesystem
        existing.images.forEach(imgPath => {
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        });

        // Update with new files
        const newImagePaths = req.files.map(file => file.path);
        existing.images = newImagePaths;
        await existing.save();

        res.status(200).json({
            success: true,
            message: 'Images updated successfully',
            data: existing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update images',
            error: error.message
        });
    }
});


// 🔻 DELETE: Remove uploaded images by ID
router.delete('/delete-uploadimage/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const uploadDoc = await UploadImages.findById(id);

        if (!uploadDoc) {
            return res.status(404).json({ success: false, message: 'Upload not found' });
        }

        // Delete images from filesystem
        uploadDoc.images.forEach(imgPath => {
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        });

        // Delete DB record
        await UploadImages.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Images and record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete images',
            error: error.message
        });
    }
});



// 🔹 POST: Record when a user clicks an image
router.post('/record-image-click-groom', async (req, res) => {
  try {
    const { phoneNumber, imageUrl } = req.body;

    if (!phoneNumber || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber and imageUrl are required'
      });
    }

    const clickEntry = new ImageClickGroom({
      phoneNumber,
      imageUrl
    });

    await clickEntry.save();

    res.status(200).json({
      success: true,
      message: 'Image click recorded successfully',
      data: clickEntry
    });
  } catch (error) {
    console.error('Image Click Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record image click',
      error: error.message
    });
  }
});



// 🔹 GET: Get all image click records (Bride)
router.get('/get-image-clicks-groom', async (req, res) => {
  try {
    const clicks = await ImageClickGroom.find().sort({ clickedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Fetched all Groom image Datas clicks successfully',
      data: clicks
    });
  } catch (error) {
    console.error('Get Image Clicks Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image clicks',
      error: error.message
    });
  }
});


module.exports = router;
