import { Webhook } from "svix"
import userModel from "../models/userModel.js"

const clerkWebhooks = async(req,res)=>{
    try{
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
        await whook.verify(JSON.stringify(req.body),{
            "svix-id":req.headers["svix-id"],
            "svix-timestamp":req.headers["svix-timestamp"],
            "svix-signature":req.headers["svix-signature"]
        })
        const {data,type} = req.body

        switch(type){
            case "user.created":{
                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url,
                    creditBalance: 5 // ⭐ Default credits
                }
                await userModel.create(userData)
                res.json({})
                break;
            }
            case "user.updated":{
                const userData = {
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url,
                }
                // ⭐ FIX: findOneAndUpdate (not fineOneAndUpdate)
                await userModel.findOneAndUpdate({clerkId:data.id}, userData)
                res.json({})
                break;
            }
            case "user.deleted":{
                // ⭐ FIX: findOneAndDelete (not fineOneAndDelete)
                await userModel.findOneAndDelete({clerkId:data.id})
                res.json({})
                break;
            }
            default:
                break;
        }
    }catch(error){
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

const userCredits = async (req,res) =>{
    try{
        // ⭐ Get from req.user (set by auth middleware)
        const clerkId = req.user?.clerkId || req.clerkId || req.body.clerkId;
        const userData = await userModel.findOne({clerkId})

        if (!userData) {
            return res.json({success: false, message: 'User not found'})
        }

        res.json({success: true, credits: userData.creditBalance})
    }catch(error){
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

export {clerkWebhooks, userCredits}