from rest_framework import serializers
from .models import KBArticle, KBCategory


class KBCategorySerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = KBCategory
        fields = ['id', 'name', 'article_count']


class KBArticleListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = KBArticle
        fields = ['id', 'title', 'slug', 'category_name', 'author_name', 'is_published', 'views_count', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        name = f'{obj.author.first_name} {obj.author.last_name}'.strip()
        return name or obj.author.username


class KBArticleDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = KBArticle
        fields = ['id', 'title', 'slug', 'body', 'category', 'category_name', 'author_name', 'is_published', 'views_count', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'views_count', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        name = f'{obj.author.first_name} {obj.author.last_name}'.strip()
        return name or obj.author.username


class KBArticleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = KBArticle
        fields = ['title', 'body', 'category', 'is_published']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
