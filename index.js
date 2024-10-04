import cors from '@fastify/cors';
import Fastify from 'fastify';
import connect from './connect.js';
import auth from './routes/auth.js';
import todos from './routes/todos.js';
import admin from './routes/admin.js';


const fastify=Fastify({
    logger:true
})
await fastify.register(cors, { 
  origin:"*",
  methods:["GET","POST","PUT","DELETE"]
})
fastify.register(connect); 
fastify.register(auth);
fastify.register(todos);
fastify.register(admin);

fastify.listen({ port: 4000 }, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    
  })