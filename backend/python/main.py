"""
main.py — FastAPI OCR Microservice entry point for CBTifyAI-Final.

Exposes endpoints:
  POST /ocr/image  →  accepts an image file (PNG/JPG/JPEG), returns extracted text
  POST /ocr/pdf    →  accepts a PDF file, returns extracted text
  GET  /health     →  health check probe
"""

import logging
import os
from contextlib import asynccontextmanager

# Disable oneDNN/MKLDNN before loading Paddle engines on Windows CPU
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr import get_ocr_engine, ocr_image_bytes, ocr_pdf_bytes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg"}
ALLOWED_PDF_TYPE = "application/pdf"

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Warming up PaddleOCR engine on startup …")
    get_ocr_engine()
    logger.info("PaddleOCR engine ready.")
    yield
    logger.info("OCR service shutting down.")

app = FastAPI(
    title="CBTifyAI-Final OCR Microservice",
    description="Extracts text from images and PDFs using PaddleOCR and PyMuPDF.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

class OCRResponse(BaseModel):
    text: str

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "ocr-microservice"}

@app.post("/ocr/image", response_model=OCRResponse, tags=["OCR"])
async def extract_from_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: PNG, JPG, JPEG.",
        )

    logger.info("Received image file: %s (%s)", file.filename, file.content_type)

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

        text = ocr_image_bytes(image_bytes)
        logger.info("Image OCR complete — extracted %d characters.", len(text))
        return OCRResponse(text=text)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Image OCR failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(exc)}")

@app.post("/ocr/pdf", response_model=OCRResponse, tags=["OCR"])
async def extract_from_pdf(file: UploadFile = File(...)):
    if file.content_type not in (ALLOWED_PDF_TYPE, "application/octet-stream"):
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{file.content_type}'. Expected a PDF.",
            )

    logger.info("Received PDF file: %s (%s)", file.filename, file.content_type)

    try:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

        text = ocr_pdf_bytes(pdf_bytes)
        logger.info("PDF OCR complete — extracted %d characters.", len(text))
        return OCRResponse(text=text)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF OCR failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(exc)}")
