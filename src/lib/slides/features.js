export const features = [
  {
    id: 'features',
    type: 'section',
    title: 'Tính năng',
    number: '03',
  },
  {
    id: 'features-overview',
    type: 'two-column',
    title: 'Chức năng chính',
    left: {
      title: 'CRUD Server',
      items: [
        'Tạo, xem, sửa, xóa server bằng k8s identity (namespace, kind, object_id, container_name)',
        'Test-server: truy vấn pod/container status qua k8s API trước khi lưu',
        'Import hàng loạt từ CSV/Excel, kết quả theo từng dòng (row-level)',
      ],
    },
    right: {
      title: 'Báo cáo định kỳ & chủ động',
      items: [
        'Định kỳ: cấu hình lịch → Temporal trigger workflow → tổng hợp số liệu → gửi mail',
        'Chủ động (on-demand): SendReport → Temporal trigger ngay lập tức',
        'Cả hai dùng chung workflow gRPC auth/server/ontime lấy thông tin + số liệu',
        'Export server ra file phục vụ sao lưu / di chuyển cấu hình',
      ],
    },
  },
  {
    id: 'ss-create',
    type: 'screenshot',
    title: 'Tạo Pod & Cấu hình Check',
    caption: 'Form tạo pod: k8s identity (namespace, kind, object), interval, timeout, container',
    src: 'assets/screenshots/create-pod.png',
  },
  {
    id: 'flow-create',
    type: 'diagram',
    title: 'Tạo Pod & Cấu hình Check — Sequence',
    diagram: `sequenceDiagram
      autonumber
      actor User
      participant GW as Cilium Gateway
      participant SRV as server-service
      participant K8S as Kubernetes API
      participant DB as Postgres (server DB)
      participant DEB as Debezium
      participant Redis as Redis Stream
      participant PING as ping-service
      participant ONT as ontime-service

      User->>GW: POST /api/v1/k8s-objects (JWT)
      GW->>SRV: reverse proxy
      SRV->>SRV: verify JWT (GoTrue OIDC)
      SRV->>K8S: EnsureNamespace + CreatePod
      K8S-->>SRV: pod created
      SRV->>DB: INSERT servers + server_http_configs (txn)
      SRV-->>User: ServerObject (pod + check config)
      DB->>DEB: logical WAL
      DEB->>Redis: uptime.public.servers
      Redis-->>PING: ServerEventHandler
      PING->>Redis: ZADD scheduler:queue:<shard>
      Redis-->>ONT: OwnershipConsumer
      ONT->>ONT: upsert server_owners (analytics)`,
  },
  {
    id: 'ss-detail',
    type: 'screenshot',
    title: 'Server Detail & Uptime',
    caption: 'Chi tiết server: k8s identity, trạng thái pod, uptime chart 30 ngày',
    src: 'assets/screenshots/server-detail.png',
  },
  {
    id: 'flow-detail',
    type: 'diagram',
    title: 'Server Detail & Uptime — Sequence',
    diagram: `sequenceDiagram
      autonumber
      actor User
      participant GW as Cilium Gateway
      participant SRV as server-service
      participant DB as Postgres (server DB)
      participant ONT as ontime-service
      participant Redis as Valkey
      participant ADB as Postgres (analytics DB)

      User->>GW: GET /api/v1/servers/{id} (JWT)
      GW->>SRV: reverse proxy
      SRV->>DB: SELECT servers WHERE id
      SRV->>ONT: gRPC GetCurrentStatuses
      ONT->>ADB: latest event per server (DISTINCT ON)
      ADB-->>ONT: ON/OFF status
      ONT-->>SRV: monitor_status
      SRV-->>User: server metadata + status
      User->>GW: GET /api/v1/servers/ontime/{id}
      GW->>ONT: reverse proxy
      ONT->>SRV: gRPC GetServer (ownership check)
      SRV-->>ONT: ServerBrief
      ONT->>Redis: MGET ontime:{id}:{date}:stats (30 ngày)
      alt cache miss
        ONT->>ADB: query server_events (lowerbound + day events)
        ADB-->>ONT: events
        Note over ONT: CalculateDayOntime
        ONT->>Redis: MSet (TTL: 1h / today 10s)
      end
      ONT-->>User: ontime_stats (30 ngày)`,
  },
  {
    id: 'ss-search',
    type: 'screenshot',
    title: 'Tìm kiếm Server',
    caption: 'Full-text search với BM25 (ParadeDB), sort theo Name/Created Date/Score',
    src: 'assets/screenshots/search.png',
  },
  {
    id: 'flow-search',
    type: 'diagram',
    title: 'Tìm kiếm Server — Sequence',
    diagram: `sequenceDiagram
      autonumber
      actor User
      participant GW as Cilium Gateway
      participant SRV as server-service
      participant PDB as ParadeDB (pg_search)
      participant ONT as ontime-service

      User->>GW: GET /api/v1/servers/search?q=&sort_by=score (JWT)
      GW->>SRV: reverse proxy
      SRV->>PDB: BM25 query (name @@@ ?, LIMIT/OFFSET)
      PDB-->>SRV: rows + total
      SRV->>ONT: gRPC GetCurrentStatuses
      ONT-->>SRV: status per server
      SRV-->>User: ServerListResponse (paginated)`,
  },
  {
    id: 'ss-import-export',
    type: 'screenshot',
    title: 'Import & Export Excel',
    caption: 'Xuất danh sách server ra Excel với filter và sort, hỗ trợ import bulk (importer-service)',
    src: 'assets/screenshots/import-export.png',
  },
  {
    id: 'flow-import-export',
    type: 'diagram',
    title: 'Import & Export Excel — Sequence',
    diagram: `sequenceDiagram
      autonumber
      actor User
      participant GW as Cilium Gateway
      participant IMP as importer-service
      participant SRV as server-service
      participant DB as Postgres (server DB)
      participant DEB as Debezium
      participant Redis as Redis Stream

      Note over User,Redis: Import — POST /api/v1/servers/import (multipart file)
      User->>GW: POST /import (JWT)
      GW->>IMP: reverse proxy
      IMP->>IMP: excelize parse + validate từng dòng
      loop chunk 100 rows
        IMP->>SRV: gRPC BatchCreateServers
        SRV->>DB: INSERT servers (bulk)
        SRV-->>IMP: per-row result
      end
      IMP-->>User: success_count / failed[]
      DB->>DEB: logical WAL
      DEB->>Redis: uptime.public.servers (bulk)

      Note over User,Redis: Export — GET /api/v1/servers/export
      User->>GW: GET /export?q=&sort_by= (JWT)
      GW->>IMP: reverse proxy
      IMP->>SRV: gRPC SearchServers
      SRV-->>IMP: ServerWithEndpoint[]
      IMP->>IMP: excelize generate xlsx
      IMP-->>User: servers.xlsx (attachment)`,
  },
  {
    id: 'ss-notifications',
    type: 'screenshot',
    title: 'Cấu hình Email Notification',
    caption: 'Cấu hình daily digest: from/to date, digest time, nút Send Report Now (notification-service)',
    src: 'assets/screenshots/notifications.png',
  },
  {
    id: 'flow-notifications',
    type: 'diagram',
    title: 'Notification & Gửi báo cáo — Sequence',
    diagram: `sequenceDiagram
      autonumber
      actor User
      participant GW as Cilium Gateway
      participant NOT as notification-service
      participant TEMP as Temporal
      participant GT as GoTrue
      participant SRV as server-service
      participant ONT as ontime-service
      participant Redis as Valkey
      participant ADB as Postgres (analytics DB)
      participant SMTP as SMTP/Mailpit

      Note over User,SMTP: Cấu hình — PUT /api/v1/notifications/config
      User->>GW: PUT /config (JWT)
      GW->>NOT: reverse proxy
      NOT->>TEMP: UpsertSchedule digest-user-{uuid}
      TEMP-->>NOT: schedule saved
      NOT-->>User: 200

      Note over User,SMTP: On-demand — POST /api/v1/notifications/send-report
      User->>GW: POST /send-report (JWT)
      GW->>NOT: reverse proxy
      NOT->>TEMP: DescribeSchedule (precondition)
      NOT->>TEMP: ExecuteWorkflow send-report
      NOT-->>User: 200 (fire-and-forget)

      Note over User,SMTP: Worker pipeline (Temporal trigger)
      TEMP->>NOT: trigger send-report workflow
      NOT->>GT: HTTP admin/users/{id} → email
      NOT->>SRV: gRPC ListServers + CountServersByStatus
      SRV->>ONT: gRPC CountByStatus
      NOT->>ONT: gRPC GetServersOntime
      ONT->>Redis: cached ontime (MGET)
      alt cache miss
        ONT->>ADB: query server_events
        Note over ONT: calculate ontime + MSet
      end
      ONT-->>NOT: ontime per server
      Note over NOT: buildReport + excelgen
      NOT->>SMTP: send email + report.xlsx
      SMTP-->>NOT: success`,
  },
  {
    id: 'crud-search',
    type: 'two-column',
    title: 'Quản lý & Tìm kiếm Server',
    left: {
      title: 'CRUD Server (server-service)',
      items: [
        'Mỗi server định danh bằng k8s object (namespace, kind, object_id)',
        'Dữ liệu phân tách theo user (created_by_id UUID)',
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
