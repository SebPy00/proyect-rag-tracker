from django.contrib import admin

from .models import Project, Column, Task, TaskEmbedding, ChatMessage

admin.site.register(Project)
admin.site.register(Column)
admin.site.register(Task)
admin.site.register(TaskEmbedding)
admin.site.register(ChatMessage)