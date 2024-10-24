import { Router } from '@/controllers/router.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'Home',
  description: 'Home API',
  method: [
    {
      type: MethodType.Get,
      authenticate: ['bearer'],
      async run(request, reply) {

        console.log(request.user)
        return reply.send('Hello World')
      },
    }
  ]
}) 