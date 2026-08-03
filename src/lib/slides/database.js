export const database = [
  {
    id: 'db-schema',
    type: 'db-schema',
    title: 'Database Schema',
    tables: [
      {
        name: 'users',
        cols: ['id (uuid)', 'email', 'password'],
        desc: 'Tài khoản người dùng do GoTrue quản lý (GoTrue DB)',
      },
      {
        name: 'servers',
        cols: ['id', 'name', 'namespace', 'kind', 'object_id', 'container_name', 'interval_ns', 'timeout_ns', 'created_by_id (uuid)'],
        desc: 'Server giám sát theo k8s identity (namespace, kind, object_id); created_by_id = UUID của user (server DB)',
      },
      {
        name: 'server_events',
        cols: ['id (UUID v7)', 'server_id', 'status ON/OFF', 'time'],
        desc: 'Lịch sử trạng thái server, dùng tính uptime (analytics DB)',
      },
      {
        name: 'server_owners',
        cols: ['server_id (PK)', 'user_id (uuid)', 'deleted_at'],
        desc: 'Read model từ CDC: server.servers → analytics.server_owners; cho ontime-service lọc theo user_id (analytics DB)',
      },
      {
        name: 'notification_configs',
        cols: ['id', 'user_id (uuid)', 'active', 'from_date', 'to_date', 'digest_time'],
        desc: 'Cấu hình digest định kỳ cho từng user, 1 user - 1 config (notification DB)',
      },
    ],
    note: 'Database riêng (server / analytics / notification) + GoTrue (user/auth data). Bảng endpoints đã được merge vào servers (k8s identity). Chỉ server DB bật wal_level=logical cho CDC. Xem slide CDC ownership replication →',
  },
  {
    id: 'erd',
    type: 'erd',
    title: 'ERD — Entity Relationship Diagram',
    src: 'assets/sql-import.svg',
  },
]
