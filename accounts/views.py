from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, Company, PushSubscription
from .serializers import UserSerializer, UserCreateSerializer, CompanySerializer, LoginSerializer, ChangePasswordSerializer
from .permissions import IsAdmin


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except TokenError:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'status': 'ok'})


class RegisterView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserCreateSerializer


class UserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    filterset_fields = ['role']

    def get_queryset(self):
        return User.objects.all()


class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class PushVapidKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        return Response({'public_key': getattr(settings, 'VAPID_PUBLIC_KEY', '')})


class PushSubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        p256dh   = request.data.get('p256dh')
        auth     = request.data.get('auth')
        if not all([endpoint, p256dh, auth]):
            return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)
        PushSubscription.objects.update_or_create(
            user=request.user, endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth},
        )
        return Response({'status': 'ok'})


class PushUnsubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        if endpoint:
            PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response({'status': 'ok'})


class CompanyListView(generics.ListCreateAPIView):
    serializer_class = CompanySerializer

    def get_queryset(self):
        return Company.objects.filter(is_active=True)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class CompanyDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
