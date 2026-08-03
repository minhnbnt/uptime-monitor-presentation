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
        'Phân phối secret key ký JWT tới từng service → khó quản lý, dễ lộ',
        'Rotate khóa khi cần phải đồng bộ thủ công giữa mọi service',
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
      participant JWKS as JWKS / OIDC Discovery

      User->>GT: POST /signup (email, password)
      GT->>GT: Tạo user, generate pair (JWT ES256)
      GT-->>User: access_token + refresh_token

      User->>GT: POST /token (email + password)
      alt Sai
        GT-->>User: 401 Unauthorized
      else Đúng
        GT-->>User: access_token + refresh_token
      end

      User->>GT: POST /token?grant_type=refresh
      GT-->>User: access_token mới

      User->>SRV-Service: Request + Bearer access_token
      SRV-Service->>JWKS: OIDC discovery (issuer/x509)
      JWKS-->>SRV-Service: public key
      SRV-Service->>SRV-Service: Verify JWT (iss, aud, exp), user_id = UUID sub
      SRV-Service-->>User: 200 OK (user_id UUID từ token)

      User->>GT: POST /logout
      GT-->>User: 200 OK`,
  },
]