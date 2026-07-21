export const cdc = [
  {
    id: 'cdc',
    type: 'section',
    title: 'Đồng bộ ownership',
    number: '04',
  },
  {
    id: 'cdc-idea',
    type: 'two-column',
    title: 'Ý tưởng',
    left: {
      title: 'Hiện trạng',
      items: [
        'CountByStatus cần biết phạm vi server của từng user',
        'ontime-service chưa có ownership local để tự tính count',
        'Phụ thuộc đồng bộ vào server-service làm flow nặng hơn',
      ],
    },
    right: {
      title: 'Hướng xử lý',
      items: [
        'Replicate ownership server -> server_owners bằng Debezium CDC',
        'CountByStatus chỉ cần user_id',
        'ontime-service JOIN local server_owners + server_events để trả count',
      ],
    },
  },
  {
    id: 'cdc-sequence',
    type: 'diagram',
    title: 'Luồng CDC ownership',
    diagram: `sequenceDiagram
      autonumber
      participant Client
      participant SRV as server-service
      participant PG as Postgres(server DB)
      participant DEB as Debezium
      participant Stream as Redis Stream (uptime.public.servers)
      participant ONT as ontime-service
      participant DB as analytics.server_owners

      SRV->>PG: INSERT/UPDATE/DELETE servers
      PG->>DEB: logical WAL
      DEB->>Stream: CDC event (servers)
      Stream->>ONT: OwnershipConsumer consume
      ONT->>DB: upsert/delete server_owners

      Client->>SRV: GET /servers/count
      SRV->>ONT: gRPC CountByStatus(user_id)
      ONT->>DB: JOIN server_owners + server_events
      DB-->>ONT: counts
      ONT-->>SRV: online/offline count`,
  },
  {
    id: 'cdc-ui',
    type: 'screenshot',
    title: 'Giao diện sử dụng ownership đã replicate',
    caption: 'Dashboard lấy count theo user_id từ server_owners local.',
    src: 'assets/screenshots/dashboard.png',
  },
]
