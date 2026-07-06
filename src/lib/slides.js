export const slides = [
  {
    id: 'title',
    type: 'title',
    title: 'UptimeMonitor',
    subtitle: 'Hệ thống giám sát uptime tự động',
    meta: 'System Design — Go • PostgreSQL • Redis • Temporal',
  },
  {
    id: 'agenda',
    type: 'list',
    title: 'Nội dung trình bày',
    items: [
      'Yêu cầu hệ thống',
      'Tech Stack & Kiến trúc tổng quan',
      'Cơ sở dữ liệu',
      'Cơ chế điều độ (ZSET + Temporal)',
      'Các chức năng chính',
      'Auth & Bảo mật',
      'Deployment',
    ],
  },
  {
    id: 'requirements',
    type: 'section',
    title: 'Yêu cầu hệ thống',
    number: '01',
  },
  {
    id: 'func-req',
    type: 'requirements',
    title: 'Yêu cầu chức năng',
    func: [
      'Đăng ký / Đăng nhập tài khoản',
      'Quản lý server (CRUD)',
      'Cấu hình endpoint (URL, method, interval, timeout, expected code)',
      'Kiểm tra uptime tự động theo lịch',
      'Xem tỉ lệ uptime theo ngày (30 ngày gần nhất)',
      'Tìm kiếm server full-text',
      'Xuất / Nhập danh sách server từ Excel',
      'Cấu hình thông báo email',
      'Gửi báo cáo định kỳ qua email',
    ],
    nonfunc: [
      'Kiểm tra 10.000 endpoint với interval 30s',
      'Điều độ task tốt, CPU không spike',
      'Không N+1 query ở hầu hết route',
      'Phần lớn file ≤ 200 dòng',
      'Stateless, dễ scale',
      'Code tổ chức tốt, dễ bảo trì',
      'Có logs cấu trúc + rotation',
    ],
  },
  {
    id: 'architecture',
    type: 'section',
    title: 'Kiến trúc tổng quan',
    number: '02',
  },
  {
    id: 'tech-stack',
    type: 'tech-stack',
    title: 'Tech Stack',
    items: [
      { icon: '🔵', name: 'Go 1.26', desc: 'Backend language, net/http + ogen' },
      { icon: '📘', name: 'ogen', desc: 'OpenAPI → Go code generation' },
      { icon: '🗄️', name: 'PostgreSQL (ParadeDB)', desc: 'pg_search extension, BM25 full-text' },
      { icon: '🔗', name: 'PgBouncer', desc: 'Connection pool (transaction mode)' },
      { icon: '🟥', name: 'Redis', desc: 'Cache + ZSET scheduler + revoke token' },
      { icon: '⏰', name: 'Temporal', desc: 'Workflow engine (Ping, SendReport)' },
      { icon: '🔐', name: 'JWT + Argon2', desc: 'Access tokens + password hashing' },
      { icon: '🐳', name: 'Docker', desc: 'Multi-stage build + Compose' },
    ],
  },
  {
    id: 'layers',
    type: 'layers',
    title: 'Kiến trúc phân lớp',
    layers: [
      { label: 'Handler', desc: 'Nhận request, validate DTO, gọi service' },
      { label: 'Service', desc: 'Business logic' },
      { label: 'Repository', desc: 'Truy vấn dữ liệu (GORM / Redis)' },
      { label: 'Infrastructure', desc: 'DB, cache, mail client, excel...' },
    ],
    note: 'Interface được định nghĩa ở nơi sử dụng (consumer) — dependency inversion.',
  },
  {
    id: 'data-flow',
    type: 'diagram',
    title: 'Luồng dữ liệu tổng quan',
    diagram: `flowchart LR
      Client -->|REST / OpenAPI| Gin[Gin Router / ogen handlers]
      Gin --> Handler --> Service --> Repository
      Repository --> Postgres[(Postgres / ParadeDB)]
      Repository --> Redis[(Redis)]
      Service -->|schedule ping| ZSET[Redis ZSET Scheduler]
      Service -->|schedule workflow| Temporal[Temporal Server]
      LoopService[LoopService] -->|claim due tasks| ZSET
      LoopService -->|ping| Target[(Endpoint)]
      Temporal -->|Workflow| Worker[Temporal Worker]
      Worker --> Target
      Worker -->|email| Mail[(SMTP)]`,
  },
  {
    id: 'database',
    type: 'section',
    title: 'Cơ sở dữ liệu',
    number: '03',
  },
  {
    id: 'db-schema',
    type: 'db-schema',
    title: 'Database Schema',
    tables: [
      {
        name: 'users',
        cols: ['id', 'email', 'username', 'password', 'name'],
        desc: 'Tài khoản người dùng, chủ sở hữu servers',
      },
      {
        name: 'servers',
        cols: ['id', 'name', 'created_by_id'],
        desc: 'Server cần giám sát',
      },
      {
        name: 'endpoints',
        cols: ['id', 'server_id', 'url', 'interval', 'timeout', 'method', 'expected_code'],
        desc: 'Cấu hình ping cho server',
      },
      {
        name: 'server_events',
        cols: ['id', 'endpoint_id', 'status (ON/OFF)', 'time'],
        desc: 'Lịch sử trạng thái endpoint',
      },
      {
        name: 'notification_configs',
        cols: ['id', 'user_id', 'active', 'from_date', 'to_date', 'digest_time'],
        desc: 'Cấu hình gửi báo cáo email',
      },
    ],
    note: 'Xem ERD ở slide tiếp theo →',
  },
  {
    id: 'erd',
    type: 'erd',
    title: 'ERD — Entity Relationship Diagram',
  },
  {
    id: 'scheduling',
    type: 'section',
    title: 'Cơ chế điều độ',
    number: '04',
  },
  {
    id: 'scheduling-detail',
    type: 'scheduling',
    title: 'Cơ chế điều độ',
    subtitle: 'Hai cơ chế song song',
    zset: {
      title: 'Redis ZSET + LoopService',
      items: [
        'Batch task (mặc định 50) mỗi 5s',
        'Lua script: claim → lock → ping → update score',
        'Nhẹ, throughput cao',
        'Phù hợp 10.000 endpoint / 30s',
      ],
    },
    temporal: {
      title: 'Temporal Workflow',
      items: [
        'PingWorkflow: ping + so sánh expected_code',
        'SendReportWorkflow: digest email',
        'Retry cơ bản, độ tin cậy cao',
        'Dùng cho tác vụ ít frequent',
      ],
    },
    note: 'Thundering herd prevention: offset = hash(key) % interval',
  },
  {
    id: 'zset-loop',
    type: 'diagram',
    title: 'ZSET Loop — Worker Flow',
    diagram: `sequenceDiagram
      autonumber
      participant Scheduler
      participant Lua
      participant Redis
      participant DB
      participant Target

      Scheduler->>Lua: Execute()
      Lua->>Redis: ZRANGEBYSCORE(now, limit=10)
      Lua->>Redis: Find next task
      Lua->>Redis: Update score += 10s (lock)
      Lua-->>Scheduler: dueTasks, nextTask

      loop Each due task
        Scheduler->>DB: Load task info
        DB-->>Scheduler: endpoint, method, interval
        Scheduler->>Target: Ping
        Target-->>Scheduler: Result
        Scheduler->>Redis: Update score = now + interval
        Scheduler->>DB: Check previous event
        alt Event changed
          Scheduler->>DB: Insert event
        end
      end

      alt fetched == 10
        Note over Scheduler: Continue immediately
      else
        Scheduler->>Scheduler: Sleep until next task
      end`,
  },
  {
    id: 'features',
    type: 'section',
    title: 'Các chức năng chính',
    number: '05',
  },
  {
    id: 'create-endpoint',
    type: 'diagram',
    title: 'Tạo Endpoint — API Flow',
    diagram: `sequenceDiagram
      actor User as Người dùng
      participant API as API Server
      participant DB as Database
      participant Redis as Redis (ZSET)

      User->>API: Đăng nhập
      User->>API: Gọi API thêm server
      API->>DB: Lưu thông tin server
      Note over API: offset = hash(key) % interval
      API->>Redis: ZADD monitoring_zset
      API-->>User: Thành công`,
  },
  {
    id: 'ontime',
    type: 'diagram',
    title: 'Tính Ontime hàng ngày',
    diagram: `sequenceDiagram
      autonumber
      participant Client
      participant Server
      participant Redis
      participant DB

      Client->>Server: Request uptime data
      Server->>Redis: MGET uptime cache
      Redis-->>Server: Cached + missing keys

      alt Missing cache exists
        Server->>DB: Query boundary events
        DB-->>Server: Start/End events
        Server->>DB: Query all events
        DB-->>Server: Events

        loop Each missing [serverId, date]
          Note over Server: Calc range
          Note over Server: Calc online intervals
          Note over Server: Calc uptime ratio
        end

        Server->>Redis: Batch SET (TTL: 10s today / 1h history)
      end

      Server-->>Client: Aggregated response`,
  },
  {
    id: 'digest',
    type: 'diagram',
    title: 'Gửi báo cáo Email',
    diagram: `sequenceDiagram
      autonumber
      participant Temporal
      participant Worker
      participant DB
      participant Redis
      participant Mail

      Temporal->>Worker: Trigger SendReportWorkflow
      Worker->>DB: Load user settings
      DB-->>Worker: Settings
      Worker->>DB: Load servers + dates
      DB-->>Worker: Server list
      Worker->>Redis: Get cached uptime
      alt Missing uptime
        Worker->>DB: Query events
        Note over Worker: Calc uptime (same algorithm)
        Worker->>Redis: Batch cache
      end
      Note over Worker: Generate Excel
      Worker->>Mail: Send email with attachment
      Mail-->>Worker: Success`,
  },
  {
    id: 'crud-search',
    type: 'two-column',
    title: 'Quản lý & Tìm kiếm Server',
    left: {
      title: 'CRUD Server',
      items: [
        'Mỗi server có 1 endpoint',
        'Dữ liệu phân tách theo user (created_by_id)',
        'Cleanup scheduler + cache khi xoá',
        'Handler → Service → Repository → DB',
      ],
    },
    right: {
      title: 'Full-text Search (ParadeDB)',
      items: [
        'BM25 search trên cột name',
        'Đếm total trước, early return nếu 0',
        'Sắp xếp theo relevance score',
        'ParadeDB = PostgreSQL + pg_search',
      ],
    },
  },
  {
    id: 'auth',
    type: 'section',
    title: 'Auth & Bảo mật',
    number: '06',
  },
  {
    id: 'auth-detail',
    type: 'card-grid',
    title: 'Auth & Bảo mật',
    cards: [
      { title: 'JWT', desc: 'Access token, middleware xác thực riêng', icon: '🔐' },
      { title: 'Argon2', desc: 'Password hashing chuẩn OWASP', icon: '🔑' },
      { title: 'Revoke Token', desc: 'Blacklist trong Redis khi logout', icon: '🚫' },
      { title: 'CORS', desc: 'Qua thư viện rs/cors', icon: '🌐' },
      { title: 'Viper Config', desc: 'CLI > env > config.yaml > default', icon: '⚙️' },
      { title: 'Zap + Lumberjack', desc: 'Structured logging + log rotation', icon: '📝' },
    ],
  },
  {
    id: 'deployment',
    type: 'section',
    title: 'Deployment',
    number: '07',
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
        icon: '🧩',
        title: 'Docker Compose',
        desc: 'app, postgres (ParadeDB), pgbouncer, redis, temporal, pgadmin',
      },
      {
        icon: '🔀',
        title: 'Air (hot-reload)',
        desc: 'make dev — tự động rebuild khi code thay đổi',
      },
      {
        icon: '🧪',
        title: 'Testing',
        desc: 'testify + testcontainers-go (real Postgres/Redis/Temporal)',
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
