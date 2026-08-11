export const auth = [
  {
    id: 'design-decisions',
    type: 'section',
    title: 'Quyết định thiết kế',
    number: '04',
  },
  {
    id: 'auth-oidc',
    type: 'two-column',
    title: 'Xác thực tập trung qua GoTrue + OIDC',
    left: {
      title: 'Vấn đề',
      items: [
        'auth-service tự viết thì phải tự code & maintain toàn bộ auth (signup, login, JWT, hash)',
        'Rotate khóa phải deploy lại toàn bộ service',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'GoTrue chuẩn OIDC có sẵn → không cần code nhiều, không phải tự maintain auth',
        'OIDC discovery giúp phân phối key dễ dàng — service lấy public key từ JWKS',
        'Dễ dàng rotate khi cần — chỉ thay đổi một nơi, các service tự nhận key mới',
      ],
    },
  },
  {
    id: 'auth-flow',
    type: 'diagram',
    title: 'Auth Flow — GoTrue & OIDC verify',
    diagram: `sequenceDiagram
      actor User as Người dùng
      participant GT as GoTrue
      participant SRV as Service (HTTP)

      User->>GT: POST /token (email + password)
      alt Sai
        GT-->>User: 401 Unauthorized
      else Đúng
        GT-->>User: access_token + refresh_token
      end

      User->>SRV-Service: Request + Bearer access_token
      SRV-Service->>GT: GET /.well-known/openid-configuration
      GT-->>SRV-Service: issuer, JWKS endpoint
      SRV-Service->>GT: GET /.well-known/jwks.json
      GT-->>SRV-Service: public key
      SRV-Service->>SRV-Service: Verify JWT (iss, aud, exp), user_id = UUID sub
      SRV-Service-->>User: 200 OK (user_id UUID từ token)`,
  },
  {
    id: 'design-search',
    type: 'scheduling',
    title: 'ParadeDB vs Elasticsearch',
    subtitle: 'Tại sao chọn ParadeDB?',
    highlight: 'right',
    leftIcon: 'E',
    left: {
      title: 'Elasticsearch (thông thường)',
      items: [
        'Hạ tầng độc lập: phải vận hành, backup, đồng bộ index riêng với database chính',
        'Query DSL (JSON) riêng, khác hẳn SQL quen thuộc',
      ],
    },
    rightIcon: 'P',
    right: {
      title: 'ParadeDB (pg_search) — dự án chọn',
      items: [
        'Extension pg_search chạy ngay trong Postgres của server-service, chỉ mục BM25',
        'Index nằm cùng transaction với dữ liệu gốc, không độ trễ đồng bộ, không thêm hạ tầng',
        'SQL/GORM quen thuộc, không cần học Query DSL hay client riêng',
        'Mã nguồn mở (AGPLv3), không lệ thuộc license thương mại',
      ],
    },
    note: 'Đánh đổi: chỉ mục BM25 không ghi theo WAL chuẩn — có thể hỏng/lệch khi Postgres crash đột ngột, cần rebuild lại. Dữ liệu gốc vẫn được WAL bảo vệ. Đổi lấy: bớt hẳn một hạ tầng search + pipeline đồng bộ.',
  },
]