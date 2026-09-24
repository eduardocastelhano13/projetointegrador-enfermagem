import { Router } from 'express'
import * as githubController from '../controllers/githubController.js'

const router = Router()

router.get('/auth', githubController.auth)
router.get('/callback', githubController.callback)
router.get('/status', githubController.status)
router.get('/user', githubController.getUser)
router.get('/repositories', githubController.getRepositories)
router.post('/disconnect', githubController.disconnect)

// Futuro (planejado, não implementado nesta etapa):
// router.get('/repositories/:id/commits', githubController.getCommits)
// router.get('/repositories/:id/issues', githubController.getIssues)
// router.get('/repositories/:id/pull-requests', githubController.getPullRequests)

export default router
