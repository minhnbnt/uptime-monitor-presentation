export const scheduling = [
  {
    id: 'event-dedup',
    type: 'two-column',
    title: 'Cơ chế Deduplication Event',
    left: {
      title: 'Vấn đề',
      items: [
        'Phần lớn các lần ping không thay đổi trạng thái so với lần trước',
        'Nếu lưu toàn bộ event → dư thừa dữ liệu không cần thiết',
        'Cần giảm tải ghi xuống ontime-service',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'Lớp 1 (ping-service): Redis cache, status giống → skip gRPC',
        'Lớp 2 (ontime-service): query event cuối trong DB, giống → skip INSERT',
        'Redis = fast path; database = nguồn sự thật cuối cùng',
      ],
    },
  },
  {
    id: 'dedup-sequence',
    type: 'diagram',
    title: 'Event Dedup — 2 lớp',
    diagram: `sequenceDiagram
      autonumber
      participant PING as ping-service
      participant Redis as Valkey Cache
      participant ONT as ontime-service
      participant DB as Postgres

      PING->>Redis: Get status cache (server_id)
      Redis-->>PING: cached status

      alt status == lastStatus
        PING->>PING: Skip gRPC (fast path)
      else key miss or status khác
        PING->>ONT: gRPC RecordEvent(server_id, status)
        ONT->>DB: SELECT latest event WHERE server_id = ?
        DB-->>ONT: last status

        alt last status == new status
          ONT->>ONT: Return nil, no INSERT
        else khác
          ONT->>DB: INSERT INTO server_events
          DB-->>ONT: OK
          ONT->>Redis: SET status cache
        end
      end`,
  },
  {
    id: 'ontime-calc',
    type: 'two-column',
    title: 'Tính uptime — BatchGetUptime (SQL)',
    left: {
      title: 'Pipeline SQL',
      items: [
        'windows: parse input JSON (endpoint_id, from, to)',
        'known_events: filter ON/OFF/UNKNOWN từ server_events',
        'timeline: carry-in (event trước window_start) + events trong window',
        'LEAD(time) → tạo half-open intervals [start, end)',
      ],
    },
    right: {
      title: 'Clamp & Tổng hợp',
      items: [
        'Clamp mỗi segment về window: GREATEST(time, window_start), LEAST(next, window_end)',
        'SUM(EXTRACT(EPOCH)) WHERE status = ON → online_seconds',
        'SUM(EXTRACT(EPOCH)) WHERE status = UNKNOWN → unknown_seconds',
        'observed_from = có carry-in thì window_start, không thì MIN(segment_start)',
      ],
    },
  },
  {
    id: 'ontime-lead',
    type: 'erd',
    title: 'LEAD(time) — biến events thành segments',
    caption: 'Mỗi row có time → LEAD lấy time của row tiếp theo → tạo khoảng [start, end). Clamp để segment không vượt cửa sổ.',
    src: 'assets/lead_events_to_segments.svg',
  },
  {
    id: 'ontime-lowerbound',
    type: 'erd',
    title: 'Lowerbound — event trước cửa sổ',
    caption: 'Hình minh họa cách tính uptime với lowerbound',
    src: 'assets/uptime_lowerbound_timeline.svg',
  },
  {
    id: 'scheduling-debezium',
    type: 'two-column',
    title: 'Vấn đề 1 — Đồng bộ cấu hình server qua Debezium',
    left: {
      title: 'Vấn đề',
      items: [
        'Cần biết ngay khi server/endpoint mới được tạo/sửa/xóa để thêm/xóa task, invalidate cache khi có thay đổi',
        'Polling DB liên tục tốn tài nguyên, độ trễ cao',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'Debezium CDC bắt sự kiện từ server-service WAL → Redis Stream',
        'ping-service consume real-time, thêm/xóa task & invalidate cache ngay khi có thay đổi',
      ],
    },
  },
  {
    id: 'scheduling-schedule',
    type: 'two-column',
    title: 'Vấn đề 2 — Điều độ task & dàn đều tải',
    left: {
      title: 'Vấn đề',
      items: [
        'Tạo nhiều server cùng lúc → check dồn vào cùng thời điểm, tải không đều',
        'Redis chạy theo cụm (cluster) → cần phân bố tải/dữ liệu đều ra nhiều node',
        'Cần tra cứu nhanh các task vừa đến hạn',
        'Tránh race condition khi nhiều worker chạy song song',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'Redis ZSET: score = timestamp lần chạy tiếp theo, AOF always',
        'Băm serverID rồi chia dư cho interval → dàn đều task theo thời gian, không bị drift',
        'Chọn shard: băm serverID rồi chia dư cho N → phân tải đều giữa các worker/node Redis',
        'Lua script atomic claim tránh race condition giữa worker song song',
      ],
    },
  },
  {
    id: 'zset-visual',
    type: 'erd',
    title: 'Cơ chế điều độ Redis ZSET (minh họa)',
    caption: 'Task theo score (thời điểm chạy). Lua claim lấy các task ≤ now (+lock 10s), peek 1 next task, còn lại không lấy.',
    src: 'assets/zset_scheduler.svg',
  },
  {
    id: 'scheduling-compare',
    type: 'scheduling',
    title: 'Temporal vs Redis ZSET',
    subtitle: 'Tại sao ZSET cho ping, Temporal chỉ cho mail',
    zset: {
      title: 'Redis ZSET cho Ping',
      items: [
        'Tần suất rất cao: 10.000 endpoint × mỗi 30s',
        'AOF always: không mất task sau downtime',
        'Lua atomic claim: tránh race condition giữa worker',
        'Sharding fnv32a(serverID) % N: giảm contention, phân tải đều',
      ],
    },
    temporal: {
      title: 'Temporal cho Mail',
      items: [
        'Tần suất thấp: daily/weekly digest',
        'Retry chắc chắn: task không được phép miss',
        'API dễ dùng — chỉ khai báo workflow, Temporal lo phần chạy lại',
        'Phù hợp low-frequency + độ bền cao',
      ],
    },
    note: 'Temporal KHÔNG dùng cho ping (config ping-workflow trong server-service chỉ là phần thừa của bản cũ). ZSET custom cho high-frequency, Temporal cho low-frequency + durability.',
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
      participant Lua as Valkey (Lua per shard)

      DEB->>Stream: servers change event
      Stream-->>Router: consume (consumer group)
      Note over Router: shard = fnv32a(serverID) % N
      Router->>Lua: ZADD scheduler:queue:<shard> (EVAL script)

      loop Mỗi shard: goroutine riêng, mỗi 5s
        W1->>Lua: ClaimDueTasksForShard(0, limit, lockMs=10000)
        Lua->>Lua: ZRANGEBYSCORE(queue:0, -inf, now, LIMIT 0 50)
        loop Each due task
          Lua->>Lua: ZADD queue:0 key = now + lockMs
        end
        Lua-->>W1: dueTasks[], nextTask[]
      end

       loop Each due task (per shard)
         W1->>Lua: Load task info
         Lua-->>W1: endpoint URL, method, interval, timeout, expected_code
         Note over W1: phase = FNV-1a(id) % interval → epoch + phase — ping 1 lần (chi tiết slide sau)
         W1->>W1: Ping HTTP/DNS (net/http → so sánh StatusCode / BodyCheckExpr)
         W1->>Lua: Reschedule: key = phase + k*interval — cộng interval tới khi vượt now
       end

      Note over WN: tương tự shard N-1 (N mặc định 1)`,
  },
  {
    id: 'offset-hash-cpu',
    type: 'erd',
    title: 'Offset băm — phẳng hóa CPU (minh họa)',
    caption: 'Không offset: mọi task chạy cùng lúc mỗi interval → CPU spike. Có offset = hash(id) % interval: task dàn đều → CPU phẳng.',
    src: 'assets/offset_hash_cpu_comparison_smooth.svg',
  },
  {
    id: 'ping-flow',
    type: 'diagram',
    title: 'Ping HTTP/DNS — check endpoint',
    diagram: `sequenceDiagram
      autonumber
      participant W1 as Worker (1 task)
      participant V as Valkey (status cache)
      participant EP as Target Endpoint

      Note over W1: Server có endpoint (url, method, interval, expected_code)
      W1->>W1: build request (method + url, timeout)
      W1->>EP: net/http GET/POST url
      EP-->>W1: StatusCode + Body
      W1->>W1: StatusCode == expected_code? + BodyCheckExpr
      alt khớp
        Note over W1: ON
      else không khớp
        Note over W1: OFF
      end
      W1->>V: Update status cache (endpoint:status)
      W1->>W1: gRPC RecordEvent → ontime-service (nếu trạng thái đổi)`,
  },
  {
    id: 'push-agent',
    type: 'two-column',
    title: 'Push Agent (hybrid monitoring)',
    left: {
      title: 'Vấn đề',
      items: [
        'Một số server nằm sau NAT/firewall — ping-service không thể chủ động ping tới',
        'Chỉ có pull probe thì thiếu trạng thái của các host không reachable từ ngoài',
      ],
    },
    right: {
      title: 'Giải pháp — ping-agent (Python)',
      items: [
        'Agent chạy trên server đích, POST /api/v1/ping/events báo trạng thái ON/OFF',
        'Đăng nhập → /auth/sessions/ping lấy token scope "ping"; refresh trước 60s khi hết hạn',
        'Cùng pipeline RecordStatusWorker với pull probe (dedup Redis + ontime DB)',
        'Rate-limit per-session (hash session_id) tránh spam event',
      ],
    },
  },
]