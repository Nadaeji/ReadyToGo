import logging
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.models import ChecklistTemplate, ChecklistItem

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_checklists(request):
    """체크리스트 템플릿 목록 조회"""
    try:
        country = request.GET.get('country')
        topic = request.GET.get('topic')
        
        queryset = ChecklistTemplate.objects.all()
        
        if country:
            queryset = queryset.filter(country__iexact=country)
        if topic:
            queryset = queryset.filter(topic__iexact=topic)
        
        checklists = []
        for template in queryset:
            items = template.items.all()
            checklists.append({
                'id': template.id,
                'name': template.name,
                'country': template.country,
                'topic': template.topic,
                'description': template.description,
                'items_count': items.count(),
                'required_items_count': items.filter(is_required=True).count(),
                'created_at': template.created_at.isoformat()
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

@api_view(['GET'])
def get_checklist_detail(request, checklist_id):
    """체크리스트 상세 조회"""
    try:
        template = get_object_or_404(ChecklistTemplate, id=checklist_id)
        items = template.items.all()
        
        items_data = []
        for item in items:
            items_data.append({
                'id': item.id,
                'title': item.title,
                'description': item.description,
                'is_required': item.is_required,
                'order': item.order,
                'estimated_time': item.estimated_time
            })
        
        return Response({
            'id': template.id,
            'name': template.name,
            'country': template.country,
            'topic': template.topic,
            'description': template.description,
            'items': items_data,
            'created_at': template.created_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"체크리스트 상세 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch checklist detail'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
