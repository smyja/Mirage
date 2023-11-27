from fastapi import HTTPException,APIRouter,File, UploadFile, Form
from fastapi.responses import FileResponse
from typing import Dict,Optional
import base64
import os
import s3fs
import requests
from dotenv import load_dotenv
from datetime import datetime
import io
from PIL import Image
import replicate
from torchvision.transforms import GaussianBlur
import requests
from io import BytesIO


router = APIRouter()
load_dotenv()
REPLICATE_API_TOKEN= os.environ["REPLICATE_API_TOKEN"]
replicate.Client(api_token=REPLICATE_API_TOKEN)
engine_id = "stable-diffusion-v1-6"
image_engine_id="stable-diffusion-xl-1024-v1-0"
api_host = os.getenv('API_HOST', 'https://api.stability.ai')
api_key = os.environ["STABILITY_API_KEY"]
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
bucket_name = os.getenv('S3_BUCKET_NAME')

fs = s3fs.S3FileSystem(key=aws_access_key_id, secret=aws_secret_access_key, s3_additional_kwargs={"ACL": "public-read"},endpoint_url="https://chatwidget.nyc3.digitaloceanspaces.com",)
if api_key is None:
    raise Exception("Missing Stability API key.")



def save_image_from_file(binary_data, prompt):

    data = {
        'image_strength': '0.35',
        'init_image_mode': 'IMAGE_STRENGTH',
        'text_prompts[0][text]': prompt,
        'text_prompts[0][weight]': '1',
        'cfg_scale': '7',
        'clip_guidance_preset': 'FAST_BLUE',
        'sampler': 'K_DPM_2_ANCESTRAL',
        'samples': '3',
        'steps': '30',
    }

    files = {
        'init_image': (None, binary_data, 'image/jpeg'),
    }

    headers = {'Authorization': f'Bearer {api_key}'}

    response = requests.post(
        f'{api_host}/v1/generation/{image_engine_id}/image-to-image',
        files=files,
        data=data,
        headers=headers
    )
    print(response)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch image. Status code: {response.status_code}")

    decoded_content = base64.b64decode(response.json()['artifacts'][0]['base64'])

    cleaned_prompt = prompt.replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_file_path = f"{cleaned_prompt}_{timestamp}.png"

    s3_path = f"{bucket_name}/{output_file_path}"

    with fs.open(s3_path, "wb") as f:
        f.write(decoded_content)

    return f"https://{bucket_name}.nyc3.cdn.digitaloceanspaces.com/{bucket_name}/{output_file_path}"


def save_image(prompt,base64_data):

    cleaned_prompt = prompt.replace(" ", "_")

    # Include prompt and date in the image name
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    image_path = f"{cleaned_prompt}_{timestamp}.png"

    s3_path = f"{bucket_name}/{image_path}"

    with fs.open(s3_path, "wb") as f:
        f.write(base64.b64decode(base64_data))

    return f"https://{bucket_name}.nyc3.cdn.digitaloceanspaces.com/{bucket_name}/{image_path}"




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

@router.post("/generate_image_from_file")
async def generate_image_from_file(
        prompt: str = Form(...),
        image_file: UploadFile = File(...),
):
    # Read the uploaded image file
    binary_data = image_file.file.read()

    # Resize the image if needed
    binary_data_resized = resize_images([binary_data])[0]

    # Call the function to fetch image and save
    output_file_path = save_image_from_file(binary_data_resized, prompt)

    return {"image_url": output_file_path}

@router.post("/generate_mask")
async def generate_mask(
    mask_prompt: str = Form(...),
    negative_mask_prompt: str = Form(...),
    image_file: UploadFile = File(...),
):
    # Assuming you want to save the uploaded image to S3
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_file_path = f"mask_{timestamp}.png"

    # Read the content of the uploaded file
    decoded_content = await image_file.read()

    # Save the content to S3
    s3_path = f"{bucket_name}/{output_file_path}"
    with fs.open(s3_path, "wb") as f:
        f.write(decoded_content)

    # Generate the URL for the mask
    image_url = f"https://{bucket_name}.nyc3.cdn.digitaloceanspaces.com/{bucket_name}/{output_file_path}"

    # Run the replicate logic with the generated mask URL
    output = replicate.run(
        "schananas/grounded_sam:ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c",
        input={
            "image": image_url,
            "mask_prompt": mask_prompt,
            "adjustment_factor": -25,  # Assuming you want to set an adjustment factor
            "negative_mask_prompt": negative_mask_prompt,  # Use the provided negative_mask_prompt
        }
    )

    # Find the inverted mask URL in the output
    mask_url = next((image for image in output if "mask" in image), None)

    if mask_url is None:
        raise HTTPException(status_code=500, detail="Inverted mask not found in the replicate output.")

    return {"mask_url": mask_url}


@router.post("/inpainting")
async def inpainting(
    mask_prompt: str = Form(...),
    mask_url: str = Form(...),
    negative_mask_prompt: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    image_link: Optional[str] = Form(None)
):
    # Check if both or none of the image inputs are provided
    if (image_file is None and image_link is None) or (image_file is not None and image_link is not None):
        raise HTTPException(status_code=400, detail="Either image_file or image_link must be provided.")

    # If image_file is provided, save it to S3 and generate the URL
    if image_file is not None:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        output_file_path = f"mask_{timestamp}.png"

        # Read the content of the uploaded file
        decoded_content = await image_file.read()

        # Save the content to S3
        s3_path = f"{bucket_name}/{output_file_path}"
        with fs.open(s3_path, "wb") as f:
            f.write(decoded_content)

        # Generate the URL for the mask
        image_url = f"https://{bucket_name}.nyc3.cdn.digitaloceanspaces.com/{bucket_name}/{output_file_path}"
    else:
        # If image_link is provided, use it as image_url
        image_url = image_link

    # Run the replicate logic with the generated mask URL
    output = replicate.run(
        "subscriptions10x/sdxl-inpainting:733bba9bba10b10225a23aae8d62a6d9752f3e89471c2650ec61e50c8c69fb23",
        input={
            "image": image_url,
            "prompt": mask_prompt,
            "n_prompt": negative_mask_prompt,
            "mask_image": mask_url
        }
    )

    # Find the inverted mask URL in the output
    inpainting_url = output[0]

    if inpainting_url is None:
        raise HTTPException(status_code=500, detail="Inverted mask not found in the replicate output.")

    return {"inpainting_url": inpainting_url}