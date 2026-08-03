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
        desc: 'OS tối giản, bất biến, chuyên cho Kubernetes — không SSH, không shell, quản lý qua talosctl (API), upgrade atomic',
      },
      {
        icon: '☸️',
        title: 'Kubernetes + Helm',
        desc: 'K8s chạy trên nền Talos; triển khai service qua helm chart; GoTrue chạy như 1 service',
      },
      {
        icon: '🌐',
        title: 'Cilium',
        desc: 'Reverse proxy (Envoy, Gateway API) route theo HTTPRoute + CORS; Network Policy giới hạn traffic giữa service',
      },
      {
        icon: '🔐',
        title: 'GoTrue',
        desc: 'Service auth: JWT ES256, OIDC discovery, mỗi service verify cục bộ',
      },
      {
        icon: '☸️',
        title: 'K8s Client (client-go)',
        desc: 'ping-service truy vấn pod/container status; RBAC ServiceAccount (pods/get, deployments/get, statefulsets/get...)',
      },
      {
        icon: '🧩',
        title: 'ZSET Sharding',
        desc: 'Băm serverID chia dư cho N shard, giảm contention; N=1 mặc định (redis.scheduler_shards)',
      },
      {
        icon: '📡',
        title: 'gRPC nội bộ',
        desc: 'common/proto (buf) làm contract; service giao tiếp qua gRPC',
      },
      {
        icon: '🧪',
        title: 'Testing',
        desc: 'testify + testcontainers-go (real Postgres/Valkey/Temporal)',
      },
      {
        icon: '📏',
        title: 'Linting',
        desc: 'golangci-lint (gofmt, govet, errcheck, staticcheck, revive...)',
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
