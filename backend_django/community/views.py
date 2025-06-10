import logging
import json
from django.shortcuts import get_object_or_404
from django.db.models import F, Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.models import CommunityPost, CommunityComment, PostLike

logger = logging.getLogger(__name__)

def get_user_session(request):
    """요청에서 사용자 세션 ID 추출"""
    # 실제 구현에서는 세션 또는 JWT 토큰에서 추출
    return request.META.get('HTTP_X_SESSION_ID', 'anonymous')

@api_view(['GET'])
def get_posts(request):
    """커뮤니티 게시글 목록 조회"""
    try:
        post_type = request.GET.get('type')  # review, question, tip, info
        country = request.GET.get('country')
        topic = request.GET.get('topic')
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        sort_by = request.GET.get('sort', 'recent')  # recent, popular, likes
        
        queryset = CommunityPost.objects.all()
        
        # 필터링
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        if country:
            queryset = queryset.filter(country__iexact=country)
        if topic:
            queryset = queryset.filter(topic__iexact=topic)
        
        # 정렬
        if sort_by == 'popular':
            queryset = queryset.order_by('-views', '-likes', '-created_at')
        elif sort_by == 'likes':
            queryset = queryset.order_by('-likes', '-created_at')
        else:  # recent
            queryset = queryset.order_by('-created_at')
        
        # 페이징
        offset = (page - 1) * limit
        posts = queryset[offset:offset + limit]
        total_count = queryset.count()
        
        posts_data = []
        for post in posts:
            posts_data.append({
                'id': post.id,
                'title': post.title,
                'content': post.content[:200] + '...' if len(post.content) > 200 else post.content,
                'post_type': post.post_type,
                'post_type_display': post.get_post_type_display(),
                'country': post.country,
                'topic': post.topic,
                'author_name': post.author_name,
                'views': post.views,
                'likes': post.likes,
                'rating': post.rating,
                'comments_count': post.comments.count(),
                'created_at': post.created_at.isoformat()
            })
        
        return Response({
            'posts': posts_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        })
        
    except Exception as e:
        logger.error(f"게시글 목록 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch posts'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_post_detail(request, post_id):
    """게시글 상세 조회"""
    try:
        post = get_object_or_404(CommunityPost, id=post_id)
        
        # 조회수 증가
        post.views = F('views') + 1
        post.save(update_fields=['views'])
        post.refresh_from_db()
        
        # 댓글 가져오기
        comments = post.comments.filter(parent__isnull=True).order_by('created_at')
        comments_data = []
        
        for comment in comments:
            replies = comment.replies.all().order_by('created_at')
            replies_data = []
            
            for reply in replies:
                replies_data.append({
                    'id': reply.id,
                    'content': reply.content,
                    'author_name': reply.author_name,
                    'likes': reply.likes,
                    'created_at': reply.created_at.isoformat()
                })
            
            comments_data.append({
                'id': comment.id,
                'content': comment.content,
                'author_name': comment.author_name,
                'likes': comment.likes,
                'replies': replies_data,
                'created_at': comment.created_at.isoformat()
            })
        
        return Response({
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'post_type': post.post_type,
            'post_type_display': post.get_post_type_display(),
            'country': post.country,
            'topic': post.topic,
            'author_name': post.author_name,
            'views': post.views,
            'likes': post.likes,
            'rating': post.rating,
            'comments': comments_data,
            'created_at': post.created_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"게시글 상세 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch post detail'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def create_post(request):
    """게시글 작성"""
    try:
        data = request.data
        user_session = get_user_session(request)
        
        # 필수 필드 검증
        required_fields = ['title', 'content', 'post_type', 'country', 'topic']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        post = CommunityPost.objects.create(
            title=data['title'],
            content=data['content'],
            post_type=data['post_type'],
            country=data['country'],
            topic=data['topic'],
            author_name=data.get('author_name', '익명'),
            author_session=user_session,
            rating=data.get('rating') if data['post_type'] == 'review' else None
        )
        
        return Response({
            'id': post.id,
            'message': 'Post created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"게시글 작성 실패: {e}")
        return Response(
            {'error': 'Failed to create post'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def create_comment(request, post_id):
    """댓글 작성"""
    try:
        post = get_object_or_404(CommunityPost, id=post_id)
        data = request.data
        user_session = get_user_session(request)
        
        if not data.get('content'):
            return Response(
                {'error': 'content is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parent_id = data.get('parent_id')
        parent = None
        if parent_id:
            parent = get_object_or_404(CommunityComment, id=parent_id)
        
        comment = CommunityComment.objects.create(
            post=post,
            content=data['content'],
            author_name=data.get('author_name', '익명'),
            author_session=user_session,
            parent=parent
        )
        
        return Response({
            'id': comment.id,
            'message': 'Comment created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"댓글 작성 실패: {e}")
        return Response(
            {'error': 'Failed to create comment'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def toggle_like(request):
    """게시글/댓글 좋아요 토글"""
    try:
        data = request.data
        user_session = get_user_session(request)
        
        post_id = data.get('post_id')
        comment_id = data.get('comment_id')
        
        if not post_id and not comment_id:
            return Response(
                {'error': 'post_id or comment_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 기존 좋아요 확인
        like_query = {}
        if post_id:
            like_query['post_id'] = post_id
            target_model = CommunityPost
            target_id = post_id
        else:
            like_query['comment_id'] = comment_id
            target_model = CommunityComment
            target_id = comment_id
        
        like_query['user_session'] = user_session
        
        existing_like = PostLike.objects.filter(**like_query).first()
        
        if existing_like:
            # 좋아요 취소
            existing_like.delete()
            target_model.objects.filter(id=target_id).update(likes=F('likes') - 1)
            liked = False
        else:
            # 좋아요 추가
            PostLike.objects.create(**like_query)
            target_model.objects.filter(id=target_id).update(likes=F('likes') + 1)
            liked = True
        
        # 업데이트된 좋아요 수 가져오기
        target_obj = target_model.objects.get(id=target_id)
        
        return Response({
            'liked': liked,
            'likes_count': target_obj.likes
        })
        
    except Exception as e:
        logger.error(f"좋아요 토글 실패: {e}")
        return Response(
            {'error': 'Failed to toggle like'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )