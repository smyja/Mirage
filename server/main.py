from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import time
from routers import stability,fixie

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True,
    expose_headers=["Content-Disposition"],
)
app.include_router(stability.router)
app.include_router(fixie.router)

# Your initialization code
load_dotenv()

# Start the timer
start_time = time.time()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)
