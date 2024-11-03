import { db } from "../models/users.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";
import nodemailer from "nodemailer";

const sendOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error("Email configuration is missing");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.verify();
  } catch (error) {
    console.error("Email transporter verification failed:", error);
    throw new Error("Email service configuration error");
  }

  try {
    await transporter.sendMail({
      from: `" vishnu's KL ERP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: " OTP for verification",
      text: `Your OTP is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">KL ERP </h2>
          <p style="font-size: 16px; color: #666;">Your OTP is:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px;">${otp}</h1>
          <p style="font-size: 14px; color: #999;">This OTP will expire in 10 minutes.</p>
        
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send OTP email");
  }
};

export const signin = async (req, res) => {
  try {
    const { Password, Email } = req.body;
    const user = await db.findOne({
      Email: Email,
    });

    if (!user) {
      return res.json({
        msg: "error",
        data: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(Password, user.Password);

    if (!validPassword) {
      return res.json({
        msg: "error",
        data: "Invalid password",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      msg: "success",
      data: user,
      token: token,
    });
  } catch (err) {
    res.json({
      msg: "error",
      data: err.message,
    });
  }
};

export const signup = async (req, res) => {
  const { Username, Password, Email } = req.body;
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return res.json({
        msg: "error",
        data: "Email service not configured properly",
      });
    }

    const existingUser = await db.findOne({ Email });
    if (existingUser) {
      return res.json({
        msg: "error",
        data: "User already exists with this email",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const newUser = await db.create({
      Username,
      Password: hashedPassword,
      Email,
      isVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    });

    try {
      await sendOTP(Email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP:", emailError);

      await db.findByIdAndDelete(newUser._id);
      return res.json({
        msg: "error",
        data: "Failed to send verification email. Please try again later.",
      });
    }

    res.json({
      msg: "verification_pending",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.json({
      msg: "error",
      data: err.message || "Failed to create user",
    });
  }
};

export const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await db.findById(userId);

    if (!user) {
      return res.json({ msg: "error", data: "User not found" });
    }

    if (user.otp !== otp || Date.now() > user.otpExpiry) {
      return res.json({ msg: "error", data: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      msg: "success",
      token,
      data: user,
    });
  } catch (err) {
    res.json({
      msg: "error",
      data: err.message,
    });
  }
};
