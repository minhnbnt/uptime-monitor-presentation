export const auth = [
  {
    id: 'auth',
    type: 'section',
    title: 'Auth & Bảo mật',
    number: '07',
  },
  {
    id: 'auth-detail',
    type: 'card-grid',
    title: 'Auth & Bảo mật',
    cards: [
      { title: 'JWT', desc: 'Access token, auth-service cấp & xác thực', icon: '🔐' },
      { title: 'Argon2', desc: 'Password hashing chuẩn OWASP', icon: '🔑' },
      { title: 'Revoke Token', desc: 'Blacklist trong Valkey khi logout', icon: '🚫' },
      { title: 'Forward-auth', desc: 'Traefik gọi auth-service verify, set X-User-ID', icon: '🌐' },
      { title: 'Viper Config', desc: 'CLI > env > config.yaml > default', icon: '⚙️' },
      { title: 'Zap + Lumberjack', desc: 'Structured logging + log rotation', icon: '📝' },
    ],
  },
  {
    id: 'auth-flow',
    type: 'diagram',
    title: 'Auth Flow — Forward-auth & Token',
    diagram: `sequenceDiagram
      actor User as Người dùng
      participant TR as Traefik
      participant AUTH as auth-service
      participant DB as Database
      participant Redis as Valkey

      User->>TR: Request có Bearer token
      TR->>AUTH: forward-auth /auth/verify
      AUTH->>AUTH: Validate JWT
      AUTH-->>TR: 200 + header X-User-ID
      TR->>TR: inject X-User-ID downstream
      TR-->>User: 200 OK (service xử lý)

      User->>AUTH: POST /auth/register
      AUTH->>DB: Tạo user (Argon2 hash)
      AUTH-->>User: access_token(15m) + refresh_token(7d)

      User->>AUTH: POST /auth/login
      AUTH->>DB: Verify credentials
      alt Sai
        AUTH-->>User: 401 Unauthorized
      else Đúng
        AUTH-->>User: access_token + refresh_token
      end

      User->>AUTH: POST /auth/refresh
      AUTH->>Redis: Check revoked?
      alt Đã thu hồi
        AUTH-->>User: 401 Unauthorized
      else Còn hạn
        AUTH->>Redis: Revoke refresh token cũ
        AUTH-->>User: Token pair mới
      end

      User->>AUTH: POST /auth/logout
      AUTH->>Redis: SET revoked_token (TTL = token expiry)
      AUTH-->>User: 200 OK`,
  },
]
