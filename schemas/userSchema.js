export const userSchema = {
    body: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string' },
            todos: {
                type: 'object',  
                required: ['tasks'],
                properties: {
                    share: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    tasks: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['id', 'task', 'finished'],
                            properties: {
                                id: { type: 'string' },
                                task: { type: 'string' },
                                finished: { type: 'boolean' }
                            }
                        }
                    }
                }
            }
        }
    }
};
