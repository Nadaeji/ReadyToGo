import logging
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.models import Checklist

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_checklists(request):
    """체크리스트 템플릿 목록 조회"""
    try:
        country = request.GET.get('country')
        if country=='America':
            country='USA'
        queryset = Checklist.objects.all()
        
        if country:
            queryset = queryset.filter(country__iexact=country)
        
        checklists = []
        for template in queryset:
            checklists.append({
                'id': template.id,
                'checklist_item': template.checklist_item,
                'country': template.country,
                'category': template.category
            })
        
        return Response({
            'checklists': checklists
        })
        
    except Exception as e:
        logger.error(f"체크리스트 목록 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch checklists'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )