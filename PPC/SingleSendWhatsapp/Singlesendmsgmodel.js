const mongoose = require("mongoose");

const SingleSendMsgSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Message title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    phoneNumbers: {
      type: [String],
      required: [true, "At least one phone number is required"],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 200,
        message: "Phone numbers must be between 1 and 200",
      },
    },

    message: {
      type: String,
      required: [true, "Message body is required"],
      trim: true,
      maxlength: [4096, "Message cannot exceed 4096 characters"],
    },

    status: {
      type: String,
      enum: ["queued", "sent", "failed", "partial"],
      default: "queued",
    },

    sentCount: {
      type: Number,
      default: 0,
    },

    failedCount: {
      type: Number,
      default: 0,
    },

    sentBy: {
      type: String,   // admin username / staff name if available
      default: "admin",
    },

    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,   // adds createdAt & updatedAt
    collection: "singlesendwhatsapps",
  }
);

/* index for faster date-based sorting */
SingleSendMsgSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SingleSendWhatsapp", SingleSendMsgSchema);