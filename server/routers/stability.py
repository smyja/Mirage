from fastapi import HTTPException,APIRouter
from fastapi.responses import FileResponse
from typing import Dict
import base64
import os
import s3fs
import requests
from dotenv import load_dotenv
from datetime import datetime

router = APIRouter()
load_dotenv()
engine_id = "stable-diffusion-v1-6"
api_host = os.getenv('API_HOST', 'https://api.stability.ai')
api_key = os.environ["STABILITY_API_KEY"]
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
bucket_name = os.getenv('S3_BUCKET_NAME')

fs = s3fs.S3FileSystem(key=aws_access_key_id, secret=aws_secret_access_key, s3_additional_kwargs={"ACL": "public-read"},endpoint_url="https://chatwidget.nyc3.digitaloceanspaces.com",)
if api_key is None:
    raise Exception("Missing Stability API key.")

@router.post("/generate_image")
async def generate_image(text_prompt: Dict[str, str]):
    response = requests.post(
        f"{api_host}/v1/generation/{engine_id}/text-to-image",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        json={
            "text_prompts": [
                {
                    "text": text_prompt["text"]
                }
            ],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        },
    )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Non-200 response: " + str(response.text))

    data = response.json()

    # Assuming only one image is generated
    image_data = data["artifacts"][0]["base64"]

    cleaned_prompt = text_prompt["text"].replace(" ", "_")
    image_path = save_image(cleaned_prompt, image_data)

    return {"image_url": image_path}

def save_image(prompt,base64_data):

    cleaned_prompt = prompt.replace(" ", "_")

    # Include prompt and date in the image name
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    image_path = f"{cleaned_prompt}_{timestamp}.png"

    s3_path = f"{bucket_name}/{image_path}"

    with fs.open(s3_path, "wb") as f:
        f.write(base64.b64decode(base64_data))

    return f"https://{bucket_name}.nyc3.cdn.digitaloceanspaces.com/{bucket_name}/{image_path}"

@router.get("/images/{image_path}")
async def get_image(image_path: str):
    image_full_path = os.path.join("./out", image_path)
    if not os.path.exists(image_full_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(image_full_path, media_type="image/png")
