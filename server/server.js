import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connect } from 'mongoose'
import connectDB from './configs/mongodb.js'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'

// App Config
const PORT = process.env.PORT || 4000
const app = express()
await connectDB()
// Initialize Middlewares
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())

// API routes
app.get('/', (req, res) => res.send("API Working"))

app.use('/api/user',userRouter);
app.use('/api/image', imageRouter);

app.listen(PORT, () => console.log("Server Running on port " + PORT))


export default app
 