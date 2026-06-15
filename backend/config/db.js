import mongoose from 'mongoose';
import dns from "dns"

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log('Connected Database...')
    }catch(err){
        console.log(`Error occured while connecting database,${err}`);
        process.exit(1);
    }
}
export default connectDB;