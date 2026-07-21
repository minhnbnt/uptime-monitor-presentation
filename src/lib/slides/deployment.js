export const deployment = [
  {
    id: 'deployment',
    type: 'section',
    title: 'Deployment',
    number: '08',
  },
  {
    id: 'deployment-detail',
    type: 'deployment',
    title: 'Đóng gói & Triển khai',
    items: [
      {
        icon: '🐳',
        title: 'Docker Multi-stage',
        desc: 'golang:1.26-alpine → buf gen → UPX compress → distroless nonroot',
      },
      {
        icon: '🧩',
        title: 'Docker Compose (13 services)',
        desc: '6 microservices + Traefik (gateway) + 7 infra: ParadeDB, PgBouncer, Valkey, Debezium, Temporal, pgAdmin, Mailpit',
      },
      {
        icon: '🔀',
        title: 'Traefik Gateway',
        desc: 'Routing theo PathPrefix, forward-auth + CORS middleware qua labels',
      },
      {
        icon: '🧩',
        title: 'ZSET Sharding',
        desc: 'fnv32a(endpointID) % N shard, giảm contention; N=1 mặc định (redis.scheduler_shards)',
      },
      {
        icon: '📡',
        title: 'gRPC nội bộ',
        desc: 'common/proto (buf) làm contract; service giao tiếp qua gRPC',
      },
      {
        icon: '🔀',
        title: 'Air (hot-reload)',
        desc: 'make dev — tự động rebuild khi code thay đổi',
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
