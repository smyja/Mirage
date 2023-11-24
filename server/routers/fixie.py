from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import httpx
import json

router = APIRouter()
load_dotenv()

api_key = os.environ["FIXIE_API_KEY"]
class ChatRequest(BaseModel):
    message: str

@router.post("/create_copy")
async def chat_endpoint(payload: ChatRequest):
    message = payload.message

    # Make a request to the external API using httpx
    url = "https://api.fixie.ai/api/v1/agents/5fbc552a-faa8-4d55-a295-4a49f25f6d2b/conversations"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    data = {"message": message}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data)

            # Check if the response status code is not successful
            response.raise_for_status()

            # Initialize a variable to store the last parsed JSON object
            last_json_object = None

            # Process the streaming response line by line
            async for line in response.aiter_lines():
                if not line:
                    continue  # Skip empty lines
                try:
                    # Parse each line as a JSON object
                    last_json_object = json.loads(line)
                    # You can process the JSON object here if needed
                    print(last_json_object)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON: {e}")

        # Check if the last_json_object is None
        if last_json_object is None:
            raise HTTPException(status_code=500, detail="Failed to parse JSON from the response")

        # Return the last parsed JSON object
        content = last_json_object["turns"][-1]["messages"][0]["content"].strip('# "')
        return {"status": "success", "response": content}

    except httpx.HTTPStatusError as e:
        # Catch HTTP errors and raise FastAPI HTTPException with appropriate status code and detail
        raise HTTPException(status_code=e.response.status_code, detail=f"External API returned an error: {e}")

    except Exception as e:
        # Catch any other unexpected errors and raise FastAPI HTTPException with 500 status code and detail
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
