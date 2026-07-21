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
      { icon: 'Go', name: 'Go 1.26', desc: 'Backend, net/http + ogen (OpenAPI gen)' },
      { icon: 'gR', name: 'gRPC + buf', desc: 'Internal RPC giữa services (protobuf)' },
      { icon: 'Og', name: 'ogen', desc: 'OpenAPI → Go code generation' },
      { icon: 'PG', name: 'PostgreSQL (ParadeDB)', desc: 'pg_search, BM25 full-text, 4 DB/service' },
      { icon: 'PB', name: 'PgBouncer', desc: 'Connection pool (transaction mode)' },
      { icon: 'Re', name: 'Valkey (Redis)', desc: 'Cache + ZSET scheduler + revoke token' },
      { icon: 'Sh', name: 'ZSET Sharding', desc: 'fnv32a(endpointID) % N shard, giảm contention trên ZSET' },
      { icon: 'DB', name: 'Debezium', desc: 'CDC: Postgres → 2 Redis Streams → ping-service (endpoints) + ontime-service (servers)' },
      { icon: 'Tr', name: 'Traefik', desc: 'API gateway + forward-auth + CORS' },
      { icon: 'Te', name: 'Temporal', desc: 'Workflow engine (SendReport digest)' },
      { icon: 'JW', name: 'JWT + Argon2', desc: 'Access tokens (15m) + password hashing' },
      { icon: 'Do', name: 'Docker', desc: 'Multi-stage + Compose (6 microservices)' },
    ],
  },
  {
    id: 'layers',
    type: 'layers',
    title: 'Cấu trúc mỗi service',
    layers: [
      { label: 'Handler', desc: 'Nhận request (ogen) / gRPC, validate DTO' },
      { label: 'Service', desc: 'Business logic' },
      { label: 'Repository', desc: 'Truy vấn dữ liệu (GORM / Valkey)' },
      { label: 'gRPC Client', desc: 'Gọi cross-service qua common/proto' },
    ],
    note: 'Interface định nghĩa ở consumer (dependency inversion). Code chung nằm trong common/ (proto, authclient).',
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

      TR -. forward-auth .-> AUTH
      AUTH -->|set X-User-ID| TR

      subgraph Workers[Internal Workers]
        PING[ping-service :50053 gRPC\\n+ ZSET scheduler]
      end

      SRV -->|gRPC :50053| PING
      IMP -->|gRPC :50051| SRV
      NOT -->|gRPC| SRV
      NOT -->|gRPC| ONT
      PING -->|gRPC :50052| ONT

      PG[(Postgres / ParadeDB)]
      PG -->|CDC WAL| DEB[Debezium]
      DEB -->|endpoints stream| PING
      DEB -->|servers stream| ONT

      SRV --> PB[PgBouncer]
      AUTH --> PB
      ONT --> PB
      NOT --> PB
      PB --> PG[(Postgres / ParadeDB)]
      PING --> V[Valkey / Redis]
      NOT --> T[Temporal]
      NOT --> M[Mailpit SMTP]`,
  },
  {
    id: 'data-flow',
    type: 'diagram',
    title: 'Luồng dữ liệu tổng quan',
    diagram: `flowchart LR
      Client -->|REST / OpenAPI| TR[Traefik Gateway]
      TR -->|forward-auth| AUTH[auth-service]
      TR -->|X-User-ID| SVC[Services]

      SVC --> Handler --> Service --> Repository
      Repository --> Postgres[(ParadeDB)]
      Repository --> Valkey[(Valkey)]

      Service -->|gRPC| Peer[gRPC Peer Service]
      Service -->|gRPC :50053| PING[ping-service]
      Service -->|register workflow| Temporal[Temporal]

      PG[(Postgres)] -->|logical WAL| DEB[Debezium]
      DEB -->|endpoints stream| PING[ping-service]
      DEB -->|servers stream| ONT[ontime-service]
      PING -->|ZSET claim| Valkey
      PING -->|gRPC event| ONT
      PING -->|HTTP ping| Target[(Endpoint)]`,
  },
]
