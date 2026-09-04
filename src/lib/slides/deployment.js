export const deployment = [
  {
    id: 'deployment',
    type: 'section',
    title: 'Triển khai',
    number: '05',
  },
  {
    id: 'deployment-detail',
    type: 'deployment',
    title: 'Đóng gói & Triển khai',
    items: [
      {
        icon: '📦',
        title: 'Container Multi-stage',
        desc: 'golang:1.27-alpine → UPX compress → distroless nonroot',
      },
      {
        icon: '☸️',
        title: 'Kubernetes + Helm',
        desc: 'Triển khai service qua helm chart; Traefik làm ingress controller',
      },
      {
        icon: '🌐',
        title: 'Traefik',
        desc: 'Reverse proxy + API Gateway: route theo PathPrefix, forward-auth (/auth/verify), CORS',
      },
      {
        icon: '🔐',
        title: 'auth-service',
        desc: 'Service auth: JWT HS256, session Argon2, forward-auth inject X-User-ID',
      },
      {
        icon: '📡',
        title: 'ping-agent',
        desc: 'Python push agent chạy out-of-band, báo trạng thái qua POST /api/v1/ping/events',
      },
    ],
  },
  {
    id: 'qa',
    type: 'qa',
    title: 'Q&A',
    subtitle: 'Cảm ơn!',
  },
]
