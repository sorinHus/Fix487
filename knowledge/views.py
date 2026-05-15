from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from .models import KBArticle, KBCategory
from .serializers import (
    KBCategorySerializer, KBArticleListSerializer,
    KBArticleDetailSerializer, KBArticleCreateSerializer,
)


class KBCategoryListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = KBCategorySerializer

    def get_queryset(self):
        return KBCategory.objects.annotate(article_count=Count('articles'))


class KBArticleListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'body']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return KBArticleCreateSerializer
        return KBArticleListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = KBArticle.objects.select_related('category', 'author')
        if user.role == 'client':
            qs = qs.filter(is_published=True)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        return qs.order_by('-updated_at')


class KBArticleDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return KBArticleCreateSerializer
        return KBArticleDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = KBArticle.objects.select_related('category', 'author')
        if user.role == 'client':
            return qs.filter(is_published=True)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)
