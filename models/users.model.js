import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  Username: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: Number },
  otpExpiry: { type: Date },
});
const db = mongoose.model("Users", UserSchema);
export { db };
