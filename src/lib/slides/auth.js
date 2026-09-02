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
    title: 'Xác thực tập trung qua auth-service + forward-auth',
    left: {
      title: 'Vấn đề',
      items: [
        'Mỗi service tự verify JWT → trùng lặp code xác thực, secret JWT bị phân tán ra nhiều nơi',
        'Nếu đổi cách verify (algorithm, claim) phải deploy lại tất cả service',
      ],
    },
    right: {
      title: 'Giải pháp',
      items: [
        'auth-service tự viết ký JWT HS256 (shared secret), cấp access/refresh + session (Argon2 hash)',
        'Traefik forward-auth (/auth/verify) verify token 1 lần duy nhất, inject header X-User-ID / X-Scopes / X-Session-ID',
        'Service chỉ đọc header qua common/authclient, không bao giờ thấy/verify JWT → rotate key tại auth-service, không redeploy service khác',
      ],
    },
  },
  {
    id: 'auth-flow',
    type: 'diagram',
    title: 'Auth Flow — auth-service & Traefik forward-auth',
    diagram: `sequenceDiagram
      actor User as Người dùng
      participant TR as Traefik
      participant AUTH as auth-service
      participant SRV as Service (HTTP)

      User->>AUTH: POST /api/v1/auth/login (email + password)
      alt Sai
        AUTH-->>User: 401 Unauthorized
      else Đúng
        AUTH-->>User: access_token + refresh_token
      end

      User->>TR: Request + Bearer access_token
      TR->>AUTH: forward-auth /auth/verify (token)
      AUTH-->>TR: 200 + X-User-ID, X-Scopes, X-Session-ID
      TR->>SRV: Request + header X-User-ID
      SRV->>SRV: authclient.GetUserID(ctx) → user_id (uint)
      SRV-->>User: 200 OK (user_id từ header)`,
  },
]