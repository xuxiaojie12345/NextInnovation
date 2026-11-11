from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.Department import router as department_router
from app.api.HolidaySettings import router as holiday_router
from app.api.Login import router as user_router
from app.api.Personnel import router as personnel_router
from app.api.Project import router as project_router
from app.api.YearSummary import router as year_summary_router
from app.core.settings import settings

app = FastAPI(title="要員稼動管理システム")

# 跨域配置（允许本地 React 开发服务器访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Login.py の router は prefix="/api/kadou" を持つため、include 時に追加 prefix は付けない
# （付けると /api/login/api/kadou/login になり、フロントの /api/kadou/login と一致しない）
app.include_router(user_router)
app.include_router(personnel_router)
app.include_router(department_router)
app.include_router(holiday_router)
app.include_router(project_router)
app.include_router(year_summary_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
    )
