import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './configs/mongodb.js'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'
import paymentRouter from './routes/paymentRoutes.js' // ⭐ Import payment routes

const PORT = process.env.PORT || 4000
const app = express()
await connectDB()

// MUST BE BEFORE ROUTES - Increase payload limits
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))
app.use(cors())

// API routes
app.get('/', (req, res) => res.send("API Working"))

app.use('/api/user', userRouter);
app.use('/api/image', imageRouter);
app.use('/api/payment', paymentRouter); // ⭐ Add payment routes

app.listen(PORT, () => console.log("Server Running on port " + PORT))

export default app