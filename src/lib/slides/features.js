export const features = [
  {
    id: 'features',
    type: 'section',
    title: 'Các chức năng chính',
    number: '06',
  },
  {
    id: 'ss-create',
    type: 'screenshot',
    title: 'Tạo Server & Cấu hình Endpoint',
    caption: 'Form tạo server + Check Method: URL, method, interval, timeout, expected code',
    src: 'assets/screenshots/create-server.png',
  },
  {
    id: 'ss-check-method',
    type: 'screenshot',
    title: 'Check Method Setup',
    caption: 'Cấu hình Pull method với endpoint URL, HTTP method, interval, timeout, expected status code',
    src: 'assets/screenshots/check-method.png',
  },
  {
    id: 'ss-detail',
    type: 'screenshot',
    title: 'Server Detail & Uptime',
    caption: 'Chi tiết server: endpoint config, trạng thái, uptime chart 30 ngày',
    src: 'assets/screenshots/server-detail.png',
  },
  {
    id: 'ss-search',
    type: 'screenshot',
    title: 'Tìm kiếm Server',
    caption: 'Full-text search với BM25 (ParadeDB), sort theo Name/Created Date/Score',
    src: 'assets/screenshots/search.png',
  },
  {
    id: 'ss-import-export',
    type: 'screenshot',
    title: 'Import & Export Excel',
    caption: 'Xuất danh sách server ra Excel với filter và sort, hỗ trợ import bulk (importer-service)',
    src: 'assets/screenshots/import-export.png',
  },
  {
    id: 'ss-notifications',
    type: 'screenshot',
    title: 'Cấu hình Email Notification',
    caption: 'Cấu hình daily digest: from/to date, digest time, nút Send Report Now (notification-service)',
    src: 'assets/screenshots/notifications.png',
  },
  {
    id: 'create-endpoint',
    type: 'diagram',
    title: 'Tạo Endpoint — API Flow',
    diagram: `sequenceDiagram
      actor User as Người dùng
      participant TR as Traefik
      participant API as server-service
      participant DB as Postgres
      participant DEB as Debezium
      participant Redis as Valkey Stream
      participant PING as ping-service

      User->>TR: POST /api/v1/servers
      TR->>API: forward (X-User-ID)
      API->>DB: Lưu server + endpoint
      API-->>User: Thành công
      DB->>DEB: WAL change (endpoints)
      DEB->>Redis: Stream event
      Redis-->>PING: consume
      Note over PING: offset = hash(key) % interval
      PING->>Redis: ZADD scheduler:queue:<shard>`,
  },
  {
    id: 'ontime',
    type: 'diagram',
    title: 'Tính Ontime hàng ngày',
    diagram: `sequenceDiagram
      autonumber
      participant Client
      participant Svc as ontime-service
      participant Redis as Valkey
      participant DB as Postgres
      participant PING as ping-service

      Client->>Svc: Request uptime data
      Svc->>Redis: MGET uptime cache
      Redis-->>Svc: Cached + missing keys

      alt Missing cache exists
        Svc->>DB: Query boundary events
        DB-->>Svc: Start/End events
        Svc->>DB: Query all events
        DB-->>Svc: Events
        loop Each missing [serverId, date]
          Note over Svc: Calc range / online / uptime ratio
        end
        Svc->>Redis: Batch SET (TTL: 10s today / 1h history)
      end
      Svc-->>Client: Aggregated response`,
  },
  {
    id: 'digest',
    type: 'diagram',
    title: 'Gửi báo cáo Email',
    diagram: `sequenceDiagram
      autonumber
      participant Temporal
      participant Worker as notification-service
      participant SRV as server-service
      participant ONT as ontime-service
      participant Redis as Valkey
      participant Mail as Mailpit

      Temporal->>Worker: Trigger SendReportWorkflow
      Worker->>SRV: gRPC Load servers + dates
      SRV-->>Worker: Server list
      Worker->>ONT: gRPC Load uptime
      ONT->>Redis: Get cached uptime
      alt Missing uptime
        ONT->>DB: Query events
        Note over ONT: Calc uptime (same algorithm)
      end
      ONT-->>Worker: Uptime data
      Note over Worker: Generate Excel
      Worker->>Mail: Send email with attachment
      Mail-->>Worker: Success`,
  },
  {
    id: 'crud-search',
    type: 'two-column',
    title: 'Quản lý & Tìm kiếm Server',
    left: {
      title: 'CRUD Server (server-service)',
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
]
