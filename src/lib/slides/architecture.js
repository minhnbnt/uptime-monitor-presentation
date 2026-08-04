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
      { icon: 'Go', name: 'Go 1.26', desc: '5 microservices + GoTrue, mỗi service một Go module riêng' },
      { icon: 'PG', name: 'ParadeDB', desc: 'PostgreSQL + pg_search (BM25 full-text), database riêng cho server/analytics/notification + GoTrue' },
      { icon: 'Re', name: 'Valkey (Redis)', desc: 'ZSET scheduler + cache + CDC stream transport' },
      { icon: 'Te', name: 'Temporal', desc: 'Workflow engine (SendReport digest, chỉ notification-service dùng)' },
      { icon: 'GT', name: 'GoTrue', desc: 'Auth tập trung chuẩn OIDC: signup/login/refresh/logout, JWT ES256, user_id = UUID sub' },
      { icon: 'k8', name: 'Kubernetes', desc: 'Chạy toàn bộ service trên nền Talos Linux (immutable, không SSH); ping-service truy vấn pod/container status qua client-go' },
      { icon: 'Ci', name: 'Cilium', desc: 'API Gateway (Envoy, Gateway API) theo HTTPRoute + Network Policy bảo vệ giao tiếp giữa service' },
    ],
  },
  {
    id: 'service-list',
    type: 'card-grid',
    title: '6 Services',
    cards: [
      { icon: '🔐', title: 'GoTrue', desc: 'Auth tập trung: đăng ký/đăng nhập email, cấp JWT, OIDC discovery' },
      { icon: '🖥️', title: 'server-service', desc: 'CRUD server theo k8s identity, kiểm tra quyền sở hữu' },
      { icon: '📡', title: 'ping-service', desc: 'Check trạng thái pod/container qua client-go, điều độ ZSET' },
      { icon: '📊', title: 'ontime-service', desc: 'Lưu lịch sử event, tính uptime %, quản lý user–server nội bộ' },
      { icon: '📧', title: 'notification-service', desc: 'Lên lịch & tổng hợp báo cáo, gửi mail qua Temporal' },
      { icon: '📥', title: 'importer-service', desc: 'Import/export hàng loạt server từ CSV/Excel' },
    ],
  },
  {
    id: 'infrastructure',
    type: 'tech-stack',
    title: 'Hạ tầng dùng chung',
    items: [
      { icon: '🌐', name: 'Cilium', desc: 'Reverse proxy (Envoy, Gateway API): route theo HTTPRoute + CORS. Network Policy kiểm soát traffic giữa các service' },
      { icon: '🐘', name: 'PostgreSQL (ParadeDB)', desc: 'wal_level=logical, BM25 full-text search, database riêng (server/analytics/notification) + GoTrue' },
      { icon: '🔄', name: 'PgBouncer', desc: 'Connection pooling transaction mode cho tất cả service' },
      { icon: '⚡', name: 'Valkey (Redis)', desc: 'appendonly=yes. ZSET scheduler + cache + CDC stream transport' },
      { icon: '🔀', name: 'Debezium', desc: 'CDC Postgres WAL → Redis Stream (uptime.public.servers): ping-service (scheduler) + ontime-service (ownership)' },
      { icon: '⏱️', name: 'Temporal', desc: 'Workflow engine cho SendReport digest mail. Chỉ notification-service dùng' },
    ],
  },
  {
    id: 'data-flow',
    type: 'diagram',
    title: 'Luồng dữ liệu tổng quan',
    diagram: `flowchart TB
      Client -->|REST / OpenAPI| TR[Cilium API Gateway]
      Client -->|REST signup/login| GT[GoTrue]

      TR -->|/api/v1/servers/*| SRV[server-service]
      TR -->|/api/v1/servers/ontime/*| ONT[ontime-service]
      TR -->|/api/v1/servers/import,export| IMP[importer-service]
      TR -->|/api/v1/notifications/*| NOT[notification-service]

      GT -->|JWT verify qua OIDC discovery| SRV
      GT -->|JWT verify qua OIDC discovery| ONT
      GT -->|JWT verify qua OIDC discovery| NOT
      GT -->|Admin API lấy email| NOT

      SRV --> PB[PgBouncer]
      ONT --> PB
      NOT --> PB
      PB --> PG[(Postgres + pg_search)]

      PING[ping-service] -->|gRPC GetServers| SRV
      SRV -->|gRPC Ping test| PING
      PING -->|gRPC RecordEvent| ONT
      IMP -->|gRPC BatchCreateServers| SRV
      NOT -->|gRPC| SRV
      NOT -->|gRPC GetServersOntime| ONT

      PING -->|ZSET claim| Redis[(Valkey / Redis)]
      PING -->|client-go query pod status| K8S[(Kubernetes API)]

      PG -->|logical WAL| DEB[Debezium]
      DEB -->|Redis Stream servers| Redis
      Redis -->|ServerConsumer| PING
      Redis -->|OwnershipConsumer| ONT

      NOT -->|schedule SendReportWorkflow| Temporal[Temporal]
      NOT -->|email digest| Mail[(SMTP)]`,
  },
  {
    id: 'architecture-total',
    type: 'erd',
    title: 'Kiến trúc tổng quan',
    src: 'assets/uptime_monitor_architecture_simple.svg',
  },
]