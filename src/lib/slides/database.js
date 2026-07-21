export const database = [
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
        desc: 'Tài khoản người dùng, auth-service tạo/quản lý (auth DB)',
      },
      {
        name: 'servers',
        cols: ['id', 'name', 'created_by_id'],
        desc: 'Server cần giám sát; created_by_id xác định chủ sở hữu (server DB)',
      },
      {
        name: 'endpoints',
        cols: ['id', 'server_id', 'url', 'interval_ns', 'timeout_ns', 'method', 'expected_code', 'body_check_expr'],
        desc: 'Cấu hình ping cho server. 1:1 với servers. Nguồn CDC cho ping-service (server DB)',
      },
      {
        name: 'server_events',
        cols: ['id (UUID v7)', 'endpoint_id', 'status ON/OFF', 'time'],
        desc: 'Lịch sử trạng thái endpoint, dùng tính uptime (analytics DB)',
      },
      {
        name: 'server_owners',
        cols: ['server_id (PK)', 'user_id', 'deleted_at'],
        desc: 'Read model từ CDC: server.servers → analytics.server_owners; cho ontime-service lọc theo user_id (analytics DB)',
      },
      {
        name: 'notification_configs',
        cols: ['id', 'user_id', 'active', 'from_date', 'to_date', 'digest_time'],
        desc: 'Cấu hình digest định kỳ cho từng user, 1 user - 1 config (notification DB)',
      },
    ],
    note: '4 database riêng (auth / server / analytics / notification). Chỉ server DB bật wal_level=logical cho CDC. Xem slide CDC ownership replication →',
  },
  {
    id: 'erd',
    type: 'erd',
    title: 'ERD — Entity Relationship Diagram',
  },
]
