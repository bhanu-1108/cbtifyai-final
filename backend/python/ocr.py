"""
ocr.py — Core OCR logic for the CBTifyAI-Final OCR Microservice.

Handles:
  - Image files  →  PaddleOCR
  - PDF files    →  PyMuPDF (selectable text) with PaddleOCR fallback for scanned pages
"""

import io
import logging
import os
from pathlib import Path
from typing import Optional

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

import fitz  # PyMuPDF
from paddleocr import PaddleOCR
from PIL import Image

logger = logging.getLogger(__name__)

_ocr_engine: Optional[PaddleOCR] = None

def get_ocr_engine() -> PaddleOCR:
    """Return the shared PaddleOCR instance (lazy-initialised)."""
    global _ocr_engine
    if _ocr_engine is None:
        logger.info("Initialising PaddleOCR engine.")
        try:
            _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", enable_mkldnn=False)
        except Exception:
            _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")
    return _ocr_engine

def ocr_image_bytes(image_bytes: bytes) -> str:
    """Run PaddleOCR on raw image bytes."""
    engine = get_ocr_engine()
    import numpy as np
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Resize large images to max 1200px for 2x faster CPU processing
    max_dim = 1200
    if max(image.width, image.height) > max_dim:
        ratio = max_dim / float(max(image.width, image.height))
        new_size = (int(image.width * ratio), int(image.height * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)

    image_np = np.array(image)

    try:
        result = engine.ocr(image_np)
    except Exception:
        result = engine.ocr(image_np)

    return _paddle_result_to_text(result)

def ocr_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extract text from a PDF efficiently.
    Fast PyMuPDF for selectable text (instant), PaddleOCR fallback for scanned pages.
    """
    from concurrent.futures import ThreadPoolExecutor

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    results = [""] * len(doc)
    scanned_pages = []

    for page_index, page in enumerate(doc):
        pymupdf_text = page.get_text("text").strip()
        # If PyMuPDF extracts text, use it instantly (0.01s per page)
        if len(pymupdf_text) >= 10:
            results[page_index] = pymupdf_text
        else:
            page_image_bytes = _page_to_image_bytes(page)
            scanned_pages.append((page_index, page_image_bytes))

    doc.close()

    if scanned_pages:
        logger.info("Running parallel OCR for %d scanned page(s)...", len(scanned_pages))
        def process_scanned_page(item):
            p_idx, p_bytes = item
            return p_idx, ocr_image_bytes(p_bytes)

        max_workers = min(4, len(scanned_pages))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            for p_idx, ocr_text in executor.map(process_scanned_page, scanned_pages):
                results[p_idx] = ocr_text

    return "\n\n".join([t for t in results if t.strip()])

def _page_to_image_bytes(page: fitz.Page, dpi: int = 150) -> bytes:
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    return pixmap.tobytes("png")

def _paddle_result_to_text(result) -> str:
    lines: list[str] = []

    if not result:
        return ""

    def extract_strings(obj):
        if isinstance(obj, str):
            if obj.strip():
                lines.append(obj.strip())
        elif isinstance(obj, dict):
            for k, v in obj.items():
                if k in ("text", "rec_text", "transcription"):
                    extract_strings(v)
                elif isinstance(v, (list, tuple, dict)):
                    extract_strings(v)
        elif isinstance(obj, (list, tuple)):
            if len(obj) == 2 and isinstance(obj[1], (list, tuple)) and len(obj[1]) >= 1 and isinstance(obj[1][0], str):
                lines.append(obj[1][0].strip())
            else:
                for item in obj:
                    extract_strings(item)
        elif hasattr(obj, "text"):
            lines.append(str(obj.text).strip())

    extract_strings(result)
    return "\n".join(lines)
