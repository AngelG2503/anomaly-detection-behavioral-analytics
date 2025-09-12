from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Request body for predictions
class InputData(BaseModel):
    feature1: float
    feature2: float

@app.get("/")
def root():
    return {"message": "ML Service is running!"}

@app.post("/predict")
def predict(data: InputData):
    # Dummy logic (replace with real ML model later)
    prediction = data.feature1 + data.feature2
    return {"prediction": prediction}
