export default function handler(req, res) {
  res.status(200).json({
    hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    nodeEnv: process.env.NODE_ENV
  });
}
