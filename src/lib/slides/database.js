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
        desc: 'Tài khoản người dùng, chủ sở hữu servers (auth DB)',
      },
      {
        name: 'servers',
        cols: ['id', 'name', 'created_by_id'],
        desc: 'Server cần giám sát (server DB)',
      },
      {
        name: 'endpoints',
        cols: ['id', 'server_id', 'url', 'interval', 'timeout', 'method', 'expected_code'],
        desc: 'Cấu hình ping cho server — nguồn CDC cho ping-service',
      },
      {
        name: 'server_events',
        cols: ['id', 'endpoint_id', 'status (ON/OFF)', 'time'],
        desc: 'Lịch sử trạng thái endpoint (analytics DB)',
      },
      {
        name: 'notification_configs',
        cols: ['id', 'user_id', 'active', 'from_date', 'to_date', 'digest_time'],
        desc: 'Cấu hình gửi báo cáo email (notification DB)',
      },
    ],
    note: 'Mỗi service sở hữu 1 DB riêng (auth / server / analytics / notification). Xem ERD ở slide tiếp theo →',
  },
  {
    id: 'erd',
    type: 'erd',
    title: 'ERD — Entity Relationship Diagram',
  },
]
