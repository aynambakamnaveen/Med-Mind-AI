import { OpenAI } from "openai";
const hftoken = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: process.env.HF_API_KEY,
});
export default hftoken;