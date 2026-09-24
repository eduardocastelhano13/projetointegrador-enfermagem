import express from 'express'
import cors from 'cors'
import session from 'express-session'
import 'dotenv/config'
import { githubConfig } from './config/github.js'
import githubRoutes from './routes/githubRoutes.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())
app.use(
  cors({
    origin: githubConfig.frontendUrl,
    credentials: true,
  })
)

// A simple in-memory session store, fine for local development. Swap for a
// real store (e.g. connect-pg-simple, Redis) before deploying anywhere with
// more than one server process.
app.use(
  session({
    name: 'vita.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    },
  })
)

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/github', githubRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Erro interno do servidor.' })
})

app.listen(PORT, () => {
  console.log(`VITA backend rodando em http://localhost:${PORT}`)
})
