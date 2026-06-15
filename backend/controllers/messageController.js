import Chat from '../model/Chat.js'
import User from '../model/User.model.js'
import axios from 'axios'
import multer from "multer"
import imageKit from '../config/imageKit.js'
import { InferenceClient } from "@huggingface/inference";
import { GoogleGenAI } from "@google/genai";
import hftoken from '../config/hftoken.js'
import { OpenAI } from "openai";
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_API_KEY,
});
export const textMessageController = async (req, res) => {
  try {
    const { chatId, prompt } = req.body;
    const userId = req.user._id;
    const file = req.file;

    const requiredCredits = file ? 2 : 1;

    if (req.user.credits < requiredCredits) {
      return res.json({
        success: false,
        message: "You don't have enough credits",
      });
    }

    // =========================
    // Upload helper
    // =========================

    async function uploadFile(buffer, fileName) {
      const result = await imageKit.upload({
        file: buffer.toString("base64"),
        fileName,
      });

      return result;
    }

    // =========================
    // Find chat
    // =========================

    const chat = await Chat.findOne({
      userId,
      _id: chatId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    let fileUrl = null;
    let fileType = null;
    let replyText = "";

    // =========================
    // Upload file if exists
    // =========================

    if (file) {
      const uploaded = await uploadFile(file.buffer, file.originalname);

      fileUrl = uploaded.url;

      fileType = file.mimetype.startsWith("image/") ? "image" : "pdf";
    }

    // =========================
    // Save user message
    // =========================

    chat.messages.push({
      role: "user",
      content: prompt || "",
      file: file
        ? {
            url: fileUrl,
            type: fileType,
            name: file.originalname,
          }
        : null,
      timestamp: new Date(),
    });

    // =========================
    // Format previous messages
    // =========================

    const formattedMessages = chat.messages
      .filter((msg) => msg.content?.trim())
      .slice(-20)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // =========================
    // Manual prompt handling
    // =========================

    const lowerPrompt = (prompt || "").toLowerCase().trim();

    // Greetings
    if (["hi", "hello", "hey", "hii", "hola"].includes(lowerPrompt)) {
      replyText = "Hi, How can I help you?";
    }

    // Bot name
    else if (
      lowerPrompt.includes("your name") ||
      lowerPrompt.includes("who are you")
    ) {
      replyText = "I am Med Mind AI, your healthcare assistant.";
    } else {
      // =========================
      // AI RESPONSE
      // =========================

      try {
        // =========================
        // FILE CHAT
        // =========================

        if (file) {
          const textPrompt =
            prompt ||
            (fileType === "pdf"
              ? "Summarize this medical document and explain the important findings in simple words."
              : "Analyze this medical image and explain findings. If unsure, say not confident.");

          const chatCompletion = await client.chat.completions.create({
            model: "google/gemma-4-31B-it:novita",

            messages: [
              {
                role: "system",
                content: `
You are Med Mind AI, a professional healthcare assistant.

Rules:
- Only answer healthcare and medical related questions.
- If user asks unrelated questions like coding, movies, politics, hacking, games, etc, reply:
"I am Med Mind AI, a medical chatbot and can only help with healthcare related questions."

- Keep answers short, professional, clear, and safe.
- Never provide dangerous medical advice.
- If unsure, recommend consulting a doctor.
`,
              },

              ...formattedMessages,

              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: textPrompt,
                  },

                  {
                    type: "image_url",
                    image_url: {
                      url: fileUrl,
                    },
                  },
                ],
              },
            ],
          });

          replyText =
            chatCompletion.choices[0].message.content ||
            "No response generated.";
        }

        // =========================
        // NORMAL TEXT CHAT
        // =========================
        else {
          const chatCompletion = await hftoken.chat.completions.create({
            model: "meta-llama/Llama-3.1-8B-Instruct",

            messages: [
              {
                role: "system",
                content: `
            You are Med Mind AI, a professional healthcare assistant.

            Rules:
            - Only answer medical and healthcare related questions.
            - If user asks unrelated questions like coding, movies, politics, hacking, games, etc, reply:
            "I am Med Mind AI, a medical chatbot and can only help with healthcare related questions."

            - If user greets you, respond politely.
            - If user asks your name, say:
            "I am Med Mind AI, your healthcare assistant."

            - Keep answers clear, concise, and professional.
            - Never provide dangerous medical advice.
            - If unsure, recommend consulting a doctor.
            `,
              },

              ...formattedMessages,
            ],
          });

          replyText =
            chatCompletion.choices[0].message.content ||
            "No response generated.";
        }
      } catch (err) {
        console.error(err);

        replyText = "Something went wrong while analyzing. Please try again.";
      }
    }

    // =========================
    // Save assistant reply
    // =========================

    chat.messages.push({
      role: "assistant",
      content: replyText,
      file: null,
      timestamp: new Date(),
    });

    // =========================
    // Save chat
    // =========================

    await chat.save();

    // =========================
    // Deduct credits
    // =========================

    const deduction = file ? -2 : -1;

    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          credits: deduction,
        },
      },
    );

    // =========================
    // Return updated chat
    // =========================

    const updatedChat = await Chat.findById(chatId);

    return res.json({
      success: true,
      chat: updatedChat,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*export const imageMessageController = async (req, res) => {
    try {
        async function uploadFile(buffer){
            const result =await imageKit.upload({
                file:buffer.toString("base64"),
                fileName:'image.jpg'
                })
                return result;
            }
        const userId = req.user._id;

        if (req.user.credits < 2) {
            return res.json({
                success: false,
                message: "You don't have enough credits"
            });
        }
        const { prompt, chatId } = req.body;
        const chat = await Chat.findOne({ userId, _id: chatId });
        // Save user message
        chat.messages.push({
            role: "User",
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        });
        // HF client
        const client = new InferenceClient(process.env.HF_API_KEY.trim());

        const imageBlob = await client.textToImage({
                provider: "fal-ai",
                model: "Tongyi-MAI/Z-Image-Turbo",
                inputs: prompt,
                parameters: { num_inference_steps: 5 },
            });
        // Blob → Buffer
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to ImageKit
        const uploadResponse = await uploadFile(buffer);
        const imageUrl = uploadResponse.url;
        // Save AI response
        const reply = {
            role: "assistant",
            content: imageUrl,
            timestamp: Date.now(),
            isImage: true
        };
        chat.messages.push(reply);

        await chat.save();

        // Deduct credits
        await User.updateOne(
            { _id: userId },
            { $inc: { credits: -2 } }
        );

        res.json({
            success: true,
            imageUrl
        });

    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            message: error.message
        });
    }
};*/
