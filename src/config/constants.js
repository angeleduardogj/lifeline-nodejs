const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 3600000, // 1 hora
  path: "/",
}

const CORS_OPTIONS = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}

module.exports = {
  JWT_SECRET,
  COOKIE_OPTIONS,
  CORS_OPTIONS
}