import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    userName: { type: String, required: true },
    name: { type: String, required: true },
    messages: [  
        {
            role: { type: String, required: true },
            content: { type: String },
            file: {
                url: String,
                type: {
                type: String,
                },
                name: String,
            },
            timestamp: { type: Number, required: true }
        }
    ]
}, { timestamps: true });

const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

export default Chat;