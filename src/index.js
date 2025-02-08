// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path: "../.env",
});

app.listen(process.env.PORT, () => {
    console.log(`server running at port : ${process.env.PORT}`);
});

app.on("error", (error) => {
    console.log("Error: ", error);
    throw error;
});
