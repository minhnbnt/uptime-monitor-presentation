export const scheduling = [
  {
    id: 'scheduling',
    type: 'section',
    title: 'Cơ chế điều độ',
    number: '05',
  },
  {
    id: 'scheduling-detail',
    type: 'scheduling',
    title: 'Cơ chế điều độ',
    subtitle: 'ZSET Loop chạy trong ping-service (worker tách biệt)',
    zset: {
      title: 'Redis ZSET + LoopWorker',
      items: [
        'Batch task (mặc định 50) mỗi 5s',
        'Lua atomic: claim → bump score → return, tránh chen giữa',
        'Offset = FNV-1a(endpointID) % interval, dàn đều theo thời gian',
        'AOF always: không mất task sau downtime',
        'Sharding: fnv32a(id) % N, mỗi shard 1 goroutine, dàn đều tải',
      ],
    },
    temporal: {
      title: 'Temporal Workflow',
      items: [
        'SendReportWorkflow: digest email định kỳ',
        'Mail ít frequent → log Temporal không thành vấn đề',
        'Retry khi lỗi, phù hợp task không được miss',
        'Không dùng Temporal cho ping: 10.000 endpoint × lưu log 1 ngày → insert chậm, lag schedule',
      ],
    },
    note: 'Debezium bắt INSERT/UPDATE/DELETE endpoints → consumer ZADD vào ZSET. Sharding giảm contention, phân tải đều.',
  },
  {
    id: 'zset-loop',
    type: 'diagram',
    title: 'ZSET Loop — ping-service (Sharded)',
    diagram: `sequenceDiagram
      autonumber
      participant DEB as Debezium (CDC)
      participant Stream as Valkey Stream
      participant Router as ping-service Router
      participant W1 as Worker shard 0
      participant WN as Worker shard N-1
      participant Lua as Lua (per shard)
      participant DB as Postgres
      participant Target as Endpoint

      DEB->>Stream: endpoints change event
      Stream-->>Router: consume (consumer group)
      Note over Router: shard = fnv32a(endpointID) % N
      Router->>Lua: ZADD scheduler:queue:<shard>

      loop Mỗi shard: goroutine riêng, mỗi 5s
        W1->>Lua: ClaimDueTasksForShard(0, limit, lockMs=10000)
        Lua->>Lua: ZRANGEBYSCORE(queue:0, -inf, now, LIMIT 0 50)
        loop Each due task
          Lua->>Lua: ZADD queue:0 score = now + lockMs
        end
        Lua-->>W1: dueTasks[], nextTask[]
      end

      loop Each due task (per shard)
        W1->>DB: Load task info
        DB-->>W1: endpoint, method, interval
        Note over W1: offset = FNV-1a(id) % interval
        W1->>Target: HTTP ping
        Target-->>W1: Status code
        W1->>Lua: Reschedule: score = now + interval
        W1->>Stream: Update status cache
        W1->>W1: gRPC → ontime-service record event
      end

      Note over WN: tương tự shard N-1 (N mặc định 1)`,
  },
  {
    id: 'event-dedup',
    type: 'two-column',
    title: 'Event Dedup — 2 lớp',
    left: {
      title: 'ping-service (trước gRPC)',
      items: [
        'Đọc status cache trong Redis',
        'Nếu status == lastStatus → skip gRPC',
        'Nếu key không tồn tại hoặc status khác → gRPC đến ontime-service',
      ],
    },
    right: {
      title: 'ontime-service (trước INSERT)',
      items: [
        'Trong 1 DB transaction: query latest event theo endpoint_id',
        'Nếu status trùng → return nil, không INSERT',
        'Nếu status khác hoặc chưa có event → INSERT',
      ],
    },
    note: 'ON → ON → ON: lần 1 ghi DB, các lần sau bị chặn bởi cả 2 lớp. Chỉ 1 row trong server_events.',
  },
  {
    id: 'ontime-calc',
    type: 'two-column',
    title: 'Tính ontime hàng ngày',
    left: {
      title: 'Tìm biên',
      items: [
        'Điểm đầu = max(start, first_event_time)',
        'Điểm cuối = min(end, now)',
        'Lấy event trước điểm đầu và điểm cuối để xác định trạng thái',
      ],
    },
    right: {
      title: 'Tính tỉ lệ',
      items: [
        'Duyệt event, tìm các khoảng ON → OFF',
        'Tổng thời gian ON / tổng thời gian',
        'Dùng cache Valkey (TTL 10s hôm nay / 1h lịch sử)',
      ],
    },
  },
]
