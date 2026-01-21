import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    photo: {
      type: String,
      required: true,
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    creditBalance: {
      type: Number,
      default: () => 5, // ✅ dynamic default credit
      min: 0,
    },
  },
  {
    timestamps: true, // ✅ good practice
  }
);

// ✅ CORRECT model creation (THIS FIXES YOUR ERROR)
const userModel =
  mongoose.models.User || mongoose.model("User", userSchema);



export default userModel;