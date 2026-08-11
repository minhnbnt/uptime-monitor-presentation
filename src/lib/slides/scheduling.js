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
        'Cần biết ngay khi server (k8s object) mới được tạo/sửa/xóa để thêm/xóa task, invalidate cache khi có thay đổi',
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
    id: 'scheduling-compare',
    type: 'scheduling',
    title: 'Temporal vs Redis ZSET',
    subtitle: 'Tại sao dùng cả hai?',
    zset: {
      title: 'Redis ZSET cho Ping',
      items: [
        'Tần suất rất cao: 10.000 server × mỗi 30s',
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
    note: 'Chi phí ghi log Temporal không phù hợp với 10k server. ZSET custom cho high-frequency, Temporal cho low-frequency + durability.',
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
        Lua-->>W1: server, namespace, kind, object_id
        Note over W1: phase = FNV-1a(id) % interval → epoch + phase — ping 1 lần (chi tiết slide sau)
        W1->>W1: Ping server/container (HTTP-DNS hoặc client-go)
        W1->>Lua: Reschedule: key = phase + k*interval — cộng interval tới khi vượt now
      end

      Note over WN: tương tự shard N-1 (N mặc định 1)`,
  },
  {
    id: 'ping-flow-k8s',
    type: 'diagram',
    title: 'Ping k8s API — check trạng thái',
    diagram: `sequenceDiagram
      autonumber
      participant W1 as Worker (1 task)
      participant K8S as Kubernetes API
      participant Stream as Valkey

      Note over W1: Server không có http_config — check trạng thái qua k8s API
      alt kind == Pod
        W1->>K8S: Get pod (namespace, object_id)
        K8S-->>W1: Pod status
        Note over W1: có container_name → check container Ready — ngược lại Pod Running + mọi container Ready
      else Deployment / StatefulSet / DaemonSet / ReplicaSet
        W1->>K8S: Get label selector (live — không cache)
        K8S-->>W1: selector
        W1->>K8S: List pods theo selector
        K8S-->>W1: danh sách pod
        Note over W1: pod nào container Ready (hoặc Pod Running) → up
      end

      W1->>Stream: Update status cache
      W1->>W1: gRPC → ontime-service record event`,
  },
  {
    id: 'ping-flow',
    type: 'diagram',
    title: 'Ping HTTP-DNS — resolve URL & stale domain',
    diagram: `sequenceDiagram
      autonumber
      participant W1 as Worker (1 task)
      participant DC as Domain Cache (Redis)
      participant K8S as Kubernetes API
      participant Stream as Valkey

      Note over W1: Server có http_config — check qua HTTP, resolve URL trước
      alt kind == Pod
        Note over W1: DomainCache key = (namespace, kind, object_id) — TTL 1h — dùng chung cho mọi server trỏ cùng Pod
        W1->>DC: GET scheduler:domain:(ns:kind:object)
        alt hit
          DC-->>W1: Pod IP cached
        else miss
          DC-->>W1: miss
          W1->>K8S: ResolveDomainName (get Pod IP)
          K8S-->>W1: Pod IP
          W1->>DC: SET TTL 1h (best-effort)
        end
      else Service / StatefulSet
        Note over W1: DNS compute trực tiếp — không đụng cache
      end
      W1->>W1: build URL + HTTP ping
      alt ping fail & kind == Pod
        W1->>K8S: CheckStale — resolve fresh
        K8S-->>W1: domain mới
        alt domain đổi
          W1->>DC: DELETE key — meta cache còn nguyên
          W1->>W1: skip event (ErrStaleDomain)
        end
      end

      W1->>Stream: Update status cache
      W1->>W1: gRPC → ontime-service record event`,
  },
]