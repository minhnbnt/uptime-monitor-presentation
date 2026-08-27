export const database = [
  {
    id: 'db-schema',
    type: 'db-schema',
    title: 'Database Schema',
    tables: [
      {
        name: 'users',
        cols: ['id (uint)', 'email', 'username', 'password'],
        desc: 'Tài khoản người dùng do auth-service quản lý (auth DB)',
      },
      {
        name: 'servers',
        cols: ['id', 'name', 'created_by_id (uint)'],
        desc: 'Server giám sát; created_by_id = id của user (server DB)',
      },
      {
        name: 'endpoints',
        cols: ['id (==servers.id, 1-1)', 'url', 'interval', 'timeout', 'method', 'expected_code', 'body_check_expr'],
        desc: 'Cấu hình check HTTP/DNS của server (server DB); endpoint.id == server.id',
      },
      {
        name: 'server_events',
        cols: ['id', 'server_id', 'status ON/OFF', 'time'],
        desc: 'Lịch sử trạng thái server, dùng tính uptime (analytics DB)',
      },
      {
        name: 'server_owners',
        cols: ['server_id (PK)', 'user_id (uint)', 'deleted_at'],
        desc: 'Read model từ CDC: server.servers → analytics.server_owners; cho ontime-service lọc theo user_id (analytics DB)',
      },
      {
        name: 'notification_configs',
        cols: ['id', 'user_id (uint)', 'active', 'from_date', 'to_date', 'digest_time'],
        desc: 'Cấu hình digest định kỳ cho từng user, 1 user - 1 config (notification DB)',
      },
    ],
    note: 'Database riêng (server / analytics / notification) + auth (user/auth data). endpoints là bảng riêng, quan hệ 1-1 với servers (endpoint.id == server.id), KHÔNG merge vào servers. Chỉ server DB bật wal_level=logical cho CDC. Xem slide CDC ownership replication →',
  },
]
