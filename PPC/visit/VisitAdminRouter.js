const express = require('express');
const UserInteraction = require('../visit/VisitAdminModel'); // Assuming UserInteraction model is in models directory
const router = express.Router();
const FollowUp = require('../FollowUp/FollowUpModel'); // Import your model
const mongoose = require('mongoose');

// Get all unique usernames
router.get('/get-all-usernames', async (req, res) => {
  try {
    const users = await UserInteraction.find({}, 'userName');
    const usernames = [...new Set(users.map(u => u.userName).filter(Boolean))];
    res.json({ usernames });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
});




// // API to transfer a file from one admin to another
// router.put('/transfer-admin', async (req, res) => {
//   try {
//     const { interactionId, fromAdmin, toAdmin } = req.body;

//     if (!interactionId || !fromAdmin || !toAdmin) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     // Update userName and push to transferHistory
//     const updated = await UserInteraction.findByIdAndUpdate(
//       interactionId,
//       {
//         userName: toAdmin,
//         $push: {
//           transferHistory: {
//             from: fromAdmin,
//             to: toAdmin,
//             date: new Date(),
//           },
//         },
//       },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ success: false, message: 'Interaction not found' });
//     }

//     res.json({
//       success: true,
//       message: 'Transfer successful',
//       data: updated,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error', error });
//   }
// });




// // GET: Fetch only userName list
// router.get('/get-all-usernames', async (req, res) => {
//   try {
//     const users = await UserInteraction.find({}, 'userName').lean(); // Only fetch userName field
//     const filteredUsernames = users
//       .map(user => user.userName)
//       .filter(Boolean); // remove null/undefined

//     res.status(200).json({
//       success: true,
//       total: filteredUsernames.length,
//       usernames: filteredUsernames,
//     });
//   } catch (err) {
//     console.error('Error fetching usernames:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });


// Endpoint to record user interaction (viewing a file)
router.post('/record-view', async (req, res) => {
    const { userName, role,viewedFile } = req.body;

    try {
        const newInteraction = new UserInteraction({
            userName,
            role,
            viewedFile,
        });

        await newInteraction.save();
        res.status(200).json({ message: 'Interaction recorded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to record interaction', error: error.message });
    }
});


// POST /record-view
router.post('/record-views', async (req, res) => {
    const { phoneNumber, viewedFile, viewTime } = req.body;
  
    try {
      const newInteraction = new UserInteraction({
        phoneNumber,
        viewedFile,
        viewTime: viewTime || new Date()  // fallback if client doesn't send
      });
  
      await newInteraction.save();
      res.status(200).json({ message: 'Interaction recorded successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to record interaction', error: error.message });
    }
  });
  
  
  // GET /get-record-views
router.get('/get-record-views-user', async (req, res) => {
  try {
    const views = await UserInteraction.find(
      { phoneNumber: { $exists: true, $ne: "" } } // Ensure phoneNumber is present and not empty
    )
      .sort({ viewTime: -1 }) // Sort by most recent first
      .select('phoneNumber viewedFile viewTime'); // Only return selected fields

    res.status(200).json(views);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch interactions',
      error: error.message
    });
  }
});



// routes/userInteractions.js or similar
router.get('/get-views-by-date', async (req, res) => {
    const { date } = req.query; // Expecting '2025-04-22' format

    if (!date) {
        return res.status(400).json({ message: 'Date is required in YYYY-MM-DD format' });
    }

    // Convert string date to start and end of the day
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    try {
        const result = await UserInteraction.aggregate([
            {
                $match: {
                    viewTime: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: "$userName",
                    viewedFiles: { $push: "$viewedFile" }
                }
            },
            {
                $project: {
                    _id: 0,
                    userName: "$_id",
                    viewedFiles: 1
                }
            }
        ]);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch data', error: error.message });
    }
});



// Get all recorded views with userName and role, exclude phoneNumber
router.get('/get-all-views-admin', async (req, res) => {
    try {
      const allViews = await UserInteraction.find({
        userName: { $exists: true, $ne: null },
        role: { $exists: true, $ne: null }
      })
      .sort({ viewTime: -1 })
      .select('-phoneNumber'); // Exclude phoneNumber
  
      res.status(200).json(allViews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch views', error: error.message });
    }
  });
  
  
  
router.get('/get-all-views-grouped', async (req, res) => {
    try {
        const result = await UserInteraction.aggregate([
            {
                $project: {
                    userName: 1,
                    viewedFile: 1,
                    viewDate: {
                        $dateToString: { format: "%Y-%m-%d", date: "$viewTime" }
                    }
                }
            },
            {
                $group: {
                    _id: { userName: "$userName", viewDate: "$viewDate" },
                    viewedFiles: { $push: "$viewedFile" }
                }
            },
            {
                $project: {
                    _id: 0,
                    userName: "$_id.userName",
                    viewDate: "$_id.viewDate",
                    viewedFiles: 1
                }
            },
            {
                $sort: { viewDate: -1, userName: 1 }
            }
        ]);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch data', error: error.message });
    }
});



router.get('/get-all-views-detailed', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const matchStage = {};

        if (startDate || endDate) {
            matchStage.viewTime = {};
            if (startDate) {
                matchStage.viewTime.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Include entire end date
                matchStage.viewTime.$lt = end;
            }
        }

        const result = await UserInteraction.aggregate([
            { $match: matchStage },
            {
                $project: {
                    userName: 1,
                    viewedFile: 1,
                    viewTime: {
                        $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$viewTime" }
                    },
                    viewDate: {
                        $dateToString: { format: "%Y-%m-%d", date: "$viewTime" }
                    }
                }
            },
            {
                $sort: { viewDate: -1, userName: 1, viewTime: 1 }
            }
        ]);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch data', error: error.message });
    }
});


router.delete('/delete-view/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await UserInteraction.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Entry not found' });
      }
      res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Deletion failed', error: error.message });
    }
  });
  


module.exports = router;
