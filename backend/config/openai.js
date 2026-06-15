
import { OpenAI } from "openai";

/*const openai = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: process.env.HF_API_KEY,
});*/
import { InferenceClient } from "@huggingface/inference";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: process.env.HF_API_KEY,
});

export default client;

