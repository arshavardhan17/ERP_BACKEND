import express from "express";
import "dotenv/config";
import connectDB from "./Database/User.js";
import cors from "cors";
import authRouter from "./Routes/auth.routes.js";
import feedbackRouter from "./Routes/feedback.routes.js";
import courseRouter from "./Routes/course.routes.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

connectDB()
  .then(() => {
    app.use("/api/auth", authRouter);
    app.use("/api/feedback", feedbackRouter);
    app.use("/api/courses", courseRouter);
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
  });

app.listen(process.env.PORT || 3009, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
