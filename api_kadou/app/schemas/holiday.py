from pydantic import BaseModel

"""休日情報レスポンス"""
class HolidaysResponse(BaseModel):    
    id: int
    year: str
    kind: str
    data: str
    name: str    

"""休日追加リクエスト"""
class HolidayRequest(BaseModel):
    kind: str
    data: str
    name: str

class HolidayImportRequest(BaseModel):
    id: str | None
    kind: str
    data: str
    name: str