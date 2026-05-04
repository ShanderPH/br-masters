from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "healthy", "service": "br-masters-api"})
