from fastapi import APIRouter
from app.api.endpoints import clients, cases, documents, auth, templates, tasks, client_portal, timesheet, document_automation, financial, stats

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(timesheet.router, prefix="/timesheet", tags=["timesheet"])
api_router.include_router(document_automation.router, prefix="/document-automation", tags=["document-automation"])
api_router.include_router(financial.router, prefix="/financial", tags=["financial"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])

# Portal do Cliente (endpoints públicos)
api_router.include_router(client_portal.router)
