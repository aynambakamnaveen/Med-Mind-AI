import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js'
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRouter.js'
import messageRouter from './routes/messageRouter.js'
import paymentRouter from "./routes/paymentRouter.js";

const app = express();

//middlewares
app.use(express.json())
app.use(
  cors({
    origin: "https://med-mind-ai-azure.vercel.app",
    credentials: true,
  }),
);

app.use(cookieParser())


app.use('/api/user',userRouter)
app.use('/api/chat',chatRouter)
app.use('/api/message',messageRouter)
app.use("/api/payment", paymentRouter);
const PORT = process.env.PORT || 8080

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on ${PORT}.....`)
    })
})