"""
Feature: Sistema de Tarefas com Taskscore
"""

from app.services.task_service import task_service
from app.models.schemas import Task, TaskCreate, TaskUpdate

__all__ = ['task_service', 'Task', 'TaskCreate', 'TaskUpdate']
