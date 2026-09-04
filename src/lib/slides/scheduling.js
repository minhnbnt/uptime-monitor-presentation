export const schedCreateDeep = [
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
    id: 'scheduling-spread',
    type: 'two-column',
    title: 'Vấn đề 2 — Dàn đều task theo thời gian',
    left: {
      title: 'Vấn đề',
      items: [
        'Tạo nhiều server cùng lúc → check dồn vào cùng thời điểm, CPU spike',
        'Cần lịch ping bám đúng nhịp dù có độ trễ xử lý',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'Redis ZSET: score = timestamp lần chạy tiếp theo, AOF always',
        'Offset khởi tạo = hash(serverID) mod interval → task dàn đều theo thời gian',
        'Lần chạy kế tiếp bám nhịp offset + k×interval, không bị drift',
      ],
    },
  },
  {
    id: 'offset-hash-cpu',
    type: 'erd',
    title: 'Offset băm — phẳng hóa CPU (minh họa)',
    caption: 'Không offset: mọi task chạy cùng lúc mỗi interval → CPU spike. Có offset = hash(id) % interval: task dàn đều → CPU phẳng.',
    src: 'assets/offset_hash_cpu_comparison_smooth.svg',
  },
  {
    id: 'scheduling-cluster',
    type: 'two-column',
    title: 'Vấn đề 3 — Phân tải theo cụm & claim an toàn',
    left: {
      title: 'Vấn đề',
      items: [
        'Redis chạy theo cụm (cluster) → cần phân bố tải/dữ liệu đều ra nhiều node',
        'Nhiều worker song song → cần tra cứu task đến hạn nhanh, tránh claim trùng',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'Sharding: hash(serverID) mod N → key scheduler:queue:<shard> phân tải đều lên các node Redis trong cụm, mỗi worker một goroutine/shard',
        'Lua script atomic claim (lấy task + khóa 10s) → không race condition',
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
  {
    id: 'freshness-lease',
    type: 'two-column',
    title: 'Phát hiện agent down — freshness lease & UNKNOWN',
    left: {
      title: 'Vấn đề',
      items: [
        'Agent chết / app tắt → không còn ai báo trạng thái, ON/OFF cuối kẹt mãi',
        'Tắt cả hệ thống microservice rồi bật lại → khoảng downtime không có event nào',
        'Cần phân biệt "server tắt" (quan sát được → OFF) với "mất khả năng quan sát"',
        'Server bị poll mà tắt: ping fail → ghi thẳng OFF, không cần chờ',
      ],
    },
    right: {
      title: 'Giải pháp — freshness lease (Redis ZSET)',
      items: [
        'Mỗi endpoint có deadline "phải nghe lại"; mỗi event (push hay poll) đều gia hạn',
        'Agent push: lease 90s (~3 chu kỳ lỡ); poll: interval riêng + 90s',
        'Hết lease mà không ai gia hạn → insert UNKNOWN (marker mất quan sát)',
      ],
    },
  },
  {
    id: 'stale-loop',
    type: 'diagram',
    title: 'StaleLoop — quét lease hết hạn, insert UNKNOWN',
    diagram: `sequenceDiagram
      autonumber
      participant STALE as StaleLoop (per shard)
      participant Lua as Valkey (Lua atomic)
      participant ONT as ontime-service
      participant DB as Postgres (analytics)

      loop mỗi chu kỳ
        STALE->>Lua: ZRANGEBYSCORE lease ≤ now (claim + khóa tạm)
        Lua-->>STALE: entries quá hạn
        loop mỗi entry
          STALE->>STALE: markUnknown, Time = deadline (không phải lúc phát hiện)
          STALE->>ONT: RecordWithTimestamp UNKNOWN (không dedupe last-status)
          alt ghi thành công
            ONT->>DB: INSERT server_events UNKNOWN
            STALE->>Lua: Remove khỏi ZSET (không sinh UNKNOWN lặp lại)
          else ghi thất bại
            Note over STALE: hết lock tự thử lại, không mất event
          end
        end
      end
      Note over STALE,DB: Tắt cả hệ thống rồi bật lại: lease đã hết hạn → quét trúng ngay, UNKNOWN đóng dấu đúng deadline, timeline không lệch`,
  },
]

export const uptimeDeep = [
  {
    id: 'event-dedup',
    type: 'two-column',
    title: 'Cơ chế Deduplication Event',
    left: {
      title: 'Vấn đề',
      items: [
        'Phần lớn các lần ping không thay đổi trạng thái so với lần trước',
        'Nếu lưu toàn bộ event → dư thừa dữ liệu không cần thiết',
        'PostgreSQL phải chịu quá nhiều request ghi liên tục ở tần suất ping',
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
        'LEAD(time) → tìm thời điểm kết thúc trạng thái',
      ],
    },
    right: {
      title: 'Tính tổng',
      items: [
        'Tạo đoạn [start, end) cho mỗi trạng thái, clamp về cửa sổ',
        'Tổng thời gian ON / tổng thời gian observed → uptime %',
        'UNKNOWN tính riêng để phân biệt "không có dữ liệu"',
      ],
    },
  },
  {
    id: 'ontime-lead',
    type: 'erd',
    title: 'LEAD(time) — biến events thành segments',
    caption: 'LEAD(time) tìm thời điểm kết thúc của mỗi trạng thái → tạo đoạn [start, end) → clamp về cửa sổ.',
    src: 'assets/lead_events_to_segments.svg',
  },
  {
    id: 'ontime-lowerbound',
    type: 'erd',
    title: 'Lowerbound — event trước cửa sổ',
    caption: 'Hình minh họa cách tính uptime với lowerbound',
    src: 'assets/uptime_lowerbound_timeline.svg',
  },
]

export const notifyDeep = [
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
]
