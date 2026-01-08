import mongoose from "mongoose";

const HarapanSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    msg: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.models.Harapan ||
  mongoose.model("Harapan", HarapanSchema);

