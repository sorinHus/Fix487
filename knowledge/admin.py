from django.contrib import admin
from .models import KBCategory, KBArticle


admin.site.register(KBCategory)

@admin.register(KBArticle)
class KBArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'is_published', 'views_count', 'created_at']
    list_filter = ['is_published', 'category']
    search_fields = ['title', 'body']
    prepopulated_fields = {'slug': ('title',)}
