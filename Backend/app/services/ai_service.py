import asyncio
from groq import Groq, AsyncGroq
from app.config import settings

class AIService:
    def __init__(self):
        # Gracefully handle missing API keys to keep the mock stack run-safe during live demos
        self.client = None
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY not in ("mock-key", "", None):
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def generate_chat_response(self, prompt: str, model: str) -> str:
        if not self.client:
            # Clean fallback responses for mock modes
            await asyncio.sleep(0.4) 
            return f"[Simulated response from {model}] System is operating in fallback mode. Your workspace architecture looks optimal."

        try:
            # A mapping from the routing service's model names to the actual Groq model IDs.
            MODEL_MAP = {
                "qwen/qwen3-32b":        "llama-3.1-8b-instant",    # Small model tier
                "openai/gpt-oss-120b":   "llama-3.1-8b-instant",    # Free/OSS model tier
                "llama3-70b-instruct":   "llama-3.3-70b-versatile", # Medium model tier
                "mixtral-8x22b-instruct":"llama-3.3-70b-versatile", # Premium model tier
            }
            # Use the mapping to find the correct Groq model, with a safe fallback.
            groq_model = MODEL_MAP.get(model, "llama-3.1-8b-instant")

            completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful engineering assistant."},
                    {"role": "user", "content": prompt}
                ],
                model=groq_model,
                temperature=0.2,
            )
            if completion.choices:
                message = completion.choices[0].message
                if message and message.content:
                    return message.content
            
            # Fallback if no valid response is found
            return f"Unable to generate a valid response from {model}."
        except Exception as e:
            return f"Error executing generation on {model}: {str(e)}. Fallback execution triggered safely."