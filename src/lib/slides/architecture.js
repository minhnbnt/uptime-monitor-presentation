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
      { icon: 'Go', name: 'Go 1.26', desc: '5 microservices + auth-service, mỗi service một Go module riêng' },
      { icon: 'PG', name: 'ParadeDB', desc: 'PostgreSQL + pg_search (BM25 full-text), database riêng cho server/analytics + auth' },
      { icon: 'Re', name: 'Valkey (Redis)', desc: 'ZSET scheduler + cache + CDC stream transport' },
      { icon: 'Te', name: 'Temporal', desc: 'Workflow engine (SendReport digest, chỉ notification-service dùng)' },
      { icon: 'Au', name: 'auth-service', desc: 'Auth tập trung tự viết: signup/login/refresh, JWT HS256, user_id = uint; Traefik forward-auth inject X-User-ID' },
      { icon: 'Tr', name: 'Traefik', desc: 'API Gateway: route theo PathPrefix + forward-auth (/auth/verify) + CORS' },
    ],
  },
  {
    id: 'service-list',
    type: 'card-grid',
    title: '6 Services',
    cards: [
      { icon: '🔐', title: 'auth-service', desc: 'Auth tập trung: đăng ký/đăng nhập email, cấp JWT HS256, forward-auth' },
      { icon: '🖥️', title: 'server-service', desc: 'CRUD server + endpoint (URL/HTTP), kiểm tra quyền sở hữu' },
      { icon: '📡', title: 'ping-service', desc: 'Check trạng thái endpoint qua HTTP/DNS, điều độ ZSET (stateless)' },
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
      { icon: '🌐', name: 'Traefik', desc: 'Reverse proxy + API Gateway: route theo PathPrefix, forward-auth (/auth/verify) inject X-User-ID, CORS' },
      { icon: '🐘', name: 'PostgreSQL (ParadeDB)', desc: 'wal_level=logical, BM25 full-text search, database riêng (server/analytics) + auth' },
      { icon: '🔄', name: 'PgBouncer', desc: 'Connection pooling transaction mode cho tất cả service' },
      { icon: '⚡', name: 'Valkey (Redis)', desc: 'appendonly=yes. ZSET scheduler + cache + CDC stream transport' },
      { icon: '🔀', name: 'Debezium', desc: 'CDC Postgres WAL → Redis Stream (uptime.public.servers, uptime.public.endpoints): ping-service (scheduler + endpoint cache) + ontime-service (ownership)' },
      { icon: '⏱️', name: 'Temporal', desc: 'Workflow engine cho SendReport digest mail. Chỉ notification-service dùng' },
    ],
  },
  {
    id: 'architecture-total',
    type: 'erd',
    title: 'Kiến trúc tổng quan',
    src: 'assets/uptime_monitor_architecture_simple.svg',
  },
]