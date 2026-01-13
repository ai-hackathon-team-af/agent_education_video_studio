"""
ファイルアップロードとテキスト抽出API
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import io

router = APIRouter(prefix="/upload", tags=["upload"])


class ExtractedTextResponse(BaseModel):
    """テキスト抽出レスポンス"""
    filename: str
    text: str
    file_type: str
    success: bool
    message: str


def extract_text_from_pdf(file_content: bytes) -> str:
    """PDFファイルからテキストを抽出"""
    try:
        from pypdf import PdfReader

        pdf_reader = PdfReader(io.BytesIO(file_content))
        text_parts = []

        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

        return "\n\n".join(text_parts)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"PDF処理エラー: {str(e)}"
        )


def extract_text_from_docx(file_content: bytes) -> str:
    """Word(.docx)ファイルからテキストを抽出"""
    try:
        from docx import Document

        doc = Document(io.BytesIO(file_content))
        text_parts = []

        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)

        return "\n\n".join(text_parts)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Word処理エラー: {str(e)}"
        )


@router.post("/extract-text", response_model=ExtractedTextResponse)
async def extract_text_from_file(file: UploadFile = File(...)):
    """
    アップロードされたファイルからテキストを抽出

    対応形式:
    - PDF (.pdf)
    - Word (.docx)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="ファイル名が必要です")

    filename = file.filename.lower()
    file_content = await file.read()

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_content)
        file_type = "pdf"
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(file_content)
        file_type = "docx"
    elif filename.endswith(".doc"):
        raise HTTPException(
            status_code=400,
            detail="古い形式のWord(.doc)は非対応です。.docx形式で保存し直してください。"
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"非対応のファイル形式です。PDF(.pdf)またはWord(.docx)をアップロードしてください。"
        )

    if not text.strip():
        return ExtractedTextResponse(
            filename=file.filename,
            text="",
            file_type=file_type,
            success=False,
            message="ファイルからテキストを抽出できませんでした。画像のみのPDFの可能性があります。"
        )

    return ExtractedTextResponse(
        filename=file.filename,
        text=text.strip(),
        file_type=file_type,
        success=True,
        message="テキストの抽出に成功しました"
    )


@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "ok", "service": "upload"}
