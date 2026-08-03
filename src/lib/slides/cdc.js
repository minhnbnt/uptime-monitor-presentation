export const cdc = [
  {
    id: 'cdc-idea',
    type: 'two-column',
    title: 'Đồng bộ quan hệ User–Server giữa các service',
    left: {
      title: 'Vấn đề',
      items: [
        'ontime-service chỉ ghi nhận event, không biết server thuộc user nào',
        'Khi đếm số server theo từng status, phải gửi rất nhiều id đến để đếm',
        'Gọi đồng bộ gRPC server-service mỗi lần → payload lớn, độ trễ tăng tuyến tính',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'Debezium CDC từ Postgres WAL của server-service → Redis Stream (uptime.public.servers)',
        'ontime-service chạy OwnershipConsumer duy trì table server_owners nội bộ',
        'CountByStatus dùng SQL JOIN cục bộ, không phụ thuộc server-service tại runtime',
        'Eventually consistent — loại bỏ synchronous call ở đường đọc aggregate/count',
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
