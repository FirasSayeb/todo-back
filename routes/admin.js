
export default async function admin(fastify,options) {

    const collection = fastify.mongo.db.collection('users')
    
    fastify.get('/api/admin/users',async function (request,reply) {
        
   
       return  await collection.find({role:"user"}).toArray();
    })

    fastify.delete('/api/admin/users/:id', async function (request, reply) {
        try {
            const userId = request.params.id;
            const ObjectId = fastify.mongo.ObjectId
          
            if (!ObjectId.isValid(userId)) {
                return reply.status(400).send({ message: 'Invalid ID format' });
            }
    
          
            const result = await collection.deleteOne({ _id: new ObjectId(userId) });
    
            if (result.deletedCount === 0) {
                return reply.status(404).send({ message: 'User not found' });
            }
    
            return reply.send({ message: 'User deleted successfully' });
        } catch (error) {
            return reply.status(500).send({ message: 'Internal Server Error', error: error.message });
        }
    });
}