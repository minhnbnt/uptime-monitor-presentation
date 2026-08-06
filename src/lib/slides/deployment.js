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
        icon: '🐳',
        title: 'Docker Multi-stage',
        desc: 'golang:1.26-alpine → UPX compress → distroless nonroot',
      },
      {
        icon: '☸️',
        title: 'Talos Linux',
        desc: 'OS tối giản, bất biến, chuyên cho Kubernetes — không SSH, không shell, bootstrap bằng OpenTofu, upgrade atomic',
      },
      {
        icon: '☸️',
        title: 'Kubernetes + Helm',
        desc: 'K8s chạy trên nền Talos; triển khai service qua helm chart; GoTrue chạy như 1 service',
      },
      {
        icon: '🌐',
        title: 'Cilium',
        desc: 'Reverse proxy (Envoy, Gateway API) chỉ route HTTP theo HTTPRoute; Network Policy giới hạn traffic giữa service',
      },
      {
        icon: '🔐',
        title: 'GoTrue',
        desc: 'Service auth: JWT ES256, OIDC discovery, mỗi service verify cục bộ',
      },
      {
        icon: '☸️',
        title: 'K8s Client (client-go)',
        desc: 'ping-service truy vấn server/container status; RBAC ServiceAccount (servers/get, deployments/get, statefulsets/get...)',
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
