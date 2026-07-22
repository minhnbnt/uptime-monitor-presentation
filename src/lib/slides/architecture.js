export const architecture = [
  {
    id: 'architecture',
    type: 'section',
    title: 'Kiến trúc microservices',
    number: '02',
  },
  {
    id: 'tech-stack',
    type: 'tech-stack',
    title: 'Tech Stack',
    items: [
      { icon: 'Go', name: 'Go 1.26', desc: '6 services, mỗi service một Go module riêng' },
      { icon: 'Og', name: 'ogen', desc: 'OpenAPI 3.0 → Go code generation' },
      { icon: 'gR', name: 'gRPC + buf', desc: 'Giao tiếp đồng bộ giữa các service (protobuf)' },
      { icon: 'PG', name: 'PostgreSQL + pg_search', desc: 'ParadeDB extension, BM25 full-text, 1 instance, 4 databases (auth/server/analytics/notification)' },
      { icon: 'PB', name: 'PgBouncer', desc: 'Connection pool (transaction mode)' },
      { icon: 'Re', name: 'Valkey (Redis)', desc: 'ZSET scheduler + cache + token blacklist + CDC stream transport' },
      { icon: 'Sh', name: 'ZSET Sharding', desc: 'fnv32a(endpointID) % N shard, giảm contention, mặc định 1 shard' },
      { icon: 'DB', name: 'Debezium', desc: 'CDC: Postgres WAL → 2 Redis Streams (uptime.public.endpoints → ping-service, uptime.public.servers → ontime-service)' },
      { icon: 'Tr', name: 'Traefik', desc: 'API gateway + forward-auth + CORS' },
      { icon: 'Te', name: 'Temporal', desc: 'Workflow engine (SendReport digest, chỉ notification-service dùng)' },
      { icon: 'JW', name: 'JWT + Argon2', desc: 'Access tokens (15m) + password hashing' },
      { icon: 'Do', name: 'Docker', desc: 'Multi-stage + distroless + Compose (6 service + Traefik + infra)' },
    ],
  },
  {
    id: 'layers',
    type: 'layers',
    title: 'Cấu trúc mỗi service',
    layers: [
      { label: 'Handler', desc: 'HTTP (ogen) / gRPC handler, validate DTO' },
      { label: 'Service', desc: 'Business logic' },
      { label: 'Repository', desc: 'Truy vấn dữ liệu (GORM / Valkey)' },
      { label: 'Infrastructure', desc: 'gRPC client, CDC consumer, mail, excel...' },
    ],
    note: 'Interface định nghĩa ở consumer (dependency inversion). Thư viện dùng chung: common/proto (protobuf), common/authclient (X-User-ID middleware).',
  },
  {
    id: 'topology',
    type: 'diagram',
    title: 'Topology — 6 Microservices',
    diagram: `flowchart TB
      Client[Client] -->|HTTPS| TR[Traefik :8080\\nAPI Gateway]

      subgraph Edge[Edge Routers]
        TR --> AUTH[auth-service :8081\\n/api/v1/auth]
        TR --> SRV[server-service :8080\\n/api/v1/servers]
        TR --> IMP[importer-service :8086\\n/import /export]
        TR --> ONT[ontime-service :8084\\n/api/v1/servers/ontime]
        TR --> NOT[notification-service :8085\\n/api/v1/notifications]
      end

      TR -. forward-auth verify .-> AUTH
      AUTH -->|set X-User-ID| TR

      subgraph Workers[Internal Workers]
        PING[ping-service :50053 gRPC\\n+ ZSET scheduler]
      end

      PING -->|gRPC GetEndpoints :50051| SRV
      SRV -->|gRPC Ping :50053| PING
      PING -->|gRPC RecordEvent :50052| ONT
      IMP -->|gRPC BatchCreateServers :50051| SRV
      NOT -->|gRPC :50051| SRV
      NOT -->|gRPC GetServersOntime :50052| ONT

      SRV --> PB[PgBouncer]
      AUTH --> PB
      ONT --> PB
      NOT --> PB
      PB --> PG[(Postgres + pg_search)]

      PG -->|logical WAL| DEB[Debezium]
      DEB -->|Redis Stream\\nuptime.public.endpoints| PING
      DEB -->|Redis Stream\\nuptime.public.servers| ONT

      PING --> V[Valkey / Redis]
      NOT --> T[Temporal]
      NOT --> M[Mailpit SMTP]`,
  },
  {
    id: 'data-flow',
    type: 'diagram',
    title: 'Luồng dữ liệu tổng quan',
    diagram: `flowchart TB
      Client -->|REST / OpenAPI| TR[Traefik Gateway]
      TR -->|forward-auth| AUTH[auth-service]
      AUTH -->|X-User-ID| TR

      TR -->|/api/v1/auth/*| AUTH
      TR -->|/api/v1/servers/*| SRV[server-service]
      TR -->|/api/v1/servers/ontime/*| ONT[ontime-service]
      TR -->|/api/v1/servers/import,export| IMP[importer-service]
      TR -->|/api/v1/notifications/*| NOT[notification-service]

      SRV --> PB[PgBouncer]
      AUTH --> PB
      ONT --> PB
      NOT --> PB
      PB --> PG[(Postgres + pg_search)]

      PING[ping-service] -->|gRPC GetEndpoints| SRV
      SRV -->|gRPC Ping test| PING
      PING -->|gRPC RecordEvent| ONT
      IMP -->|gRPC BatchCreateServers| SRV
      NOT -->|gRPC| SRV
      NOT -->|gRPC GetServersOntime| ONT

      PING -->|ZSET claim| Redis[(Valkey / Redis)]
      PING -->|HTTP ping| Target[(Endpoint)]

      PG -->|logical WAL| DEB[Debezium]
      DEB -->|Redis Stream| Redis
      Redis -->|EndpointConsumer| PING
      Redis -->|OwnershipConsumer| ONT

      NOT -->|schedule SendReportWorkflow| Temporal[Temporal]
      NOT -->|email digest| Mail[(Mailpit SMTP)]`,
  },
]
