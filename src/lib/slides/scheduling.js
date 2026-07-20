export const scheduling = [
  {
    id: 'scheduling',
    type: 'section',
    title: 'Cơ chế điều độ',
    number: '04',
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
        'Lua atomic: claim → bump score (lock) → return',
        'Sharding: fnv32a(endpointID) % N shard, mỗi shard 1 goroutine + 1 Lua claim',
        'Cache-through: Valkey hash (TTL 1h) → fallback DB',
        '10.000 endpoint / 30s, CPU không spike',
      ],
    },
    temporal: {
      title: 'Temporal Workflow',
      items: [
        'SendReportWorkflow: digest email định kỳ',
        'Retry cơ bản, độ tin cậy cao',
        'Dùng cho tác vụ ít frequent',
      ],
    },
    note: 'Thiết kế sẵn sàng chuyển sang cụm Redis (Redis Cluster). Hiện chạy single-node Valkey, N mặc định 1 (config redis.scheduler_shards).',
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
]
