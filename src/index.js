import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";


dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })
    app.listen(process.env.PORT || 5555, () => {
        console.log(`Server online at PORT: ${process.env.PORT}`)
    })
})
.catch(err => {console.log("ERROR: MongoDB Connection failed !!, err: ", err)})

























/* alternative way to connect with db  (first approach)
import express from "express";
const app = express()
//iife to call connection from db
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`app is listening on ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()
*/