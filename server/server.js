import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connect } from 'mongoose'
import connectDB from './configs/mongodb.js'
import dotenv from "dotenv";
dotenv.config();
// App Config
const PORT = process.env.PORT || 4000
const app = express()
await connectDB()
// Initialize Middlewares
app.use(express.json())
app.use(cors())

// API routes
app.get('/', (req, res) => res.send("API Working"))

app.listen(PORT, () => console.log("Server Running on port " + PORT))
