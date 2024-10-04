
import { ObjectId } from 'mongodb';
import { userSchema } from "../schemas/userSchema.js";
import  mjml2html from 'mjml'; 
import nodemailer from 'nodemailer';
export default async function todos(fastify, options) {
    const collection = fastify.mongo.db.collection('users');

    
    fastify.get('/api/todos', async (request, reply) => {
        const user = await collection.findOne(
            { email: request.query.email },
            { projection: { "todos": 1 } }
        );
    
        if (!user) return null;
    
        
        const sharedWith = user.todos.sharedWith || [];
    
        
        const sharedTasks = await Promise.all(sharedWith.map(async (sharedUser) => {
            const sharedUserData = await collection.findOne(
                { email: sharedUser.userEmail },
                { projection: { "todos": 1 } }
            );  
    
            return {
                userEmail: sharedUser.userEmail,
                mode: sharedUser.mode, 
                tasks: sharedUserData ? sharedUserData.todos.tasks : []
            };
        }));
    
        return {  
            ...user.todos,
            sharedTasks
        };
    }); 
    
    
    
    
    
    

   

    fastify.post('/api/todos/tasks', async (request, reply) => {
        const { email, task } = request.body; 
    
       
        if (!email || !task) {
            return reply.status(400).send({ message: 'Email and task are required' });
        }
    
        const newTask = { id: new ObjectId().toString(), ...task }; 
    
        const result = await collection.updateOne(
            { email: email },
            { $push: { "todos.tasks": newTask } }  
        );
    
        if (result.modifiedCount === 1) {
            reply.status(200).send({ message: 'Task added successfully' });
        } else {
           // reply.status(400).send({ message: 'Failed to add task' });
        }
    });
    

   
    fastify.put('/api/todos/tasks/:taskId', async (request, reply) => {
        const { email } = request.query; 
        const { task, finished } = request.body;
    
        const result = await collection.updateOne(
            { email: email, "todos.tasks.id": request.params.taskId },
            { $set: { "todos.tasks.$.task": task, "todos.tasks.$.finished": finished } }
        );
    
        if (result.modifiedCount === 1) {
            reply.status(200).send({ message: 'Task updated successfully' });
        } else {
            reply.status(400).send({ message: 'Failed to update task' });
        }
    });
    

    
    fastify.delete('/api/todos/tasks/:taskId', async (request, reply) => {
        return await collection.updateOne(
            { email: request.query.email },
            { $pull: { "todos.tasks": { id: request.params.taskId } } }
        );
    });

    const sendEmail = async (toEmail, shareWith, mode) => {
        const mjmlTemplate = `
            <mjml>
                <mj-body>
                    <mj-section> 
                        <mj-column>
                            <mj-text>Hi,</mj-text>
                            <mj-text>${shareWith} has shared a todo list with you in ${mode} mode.</mj-text>
                        </mj-column>
                    </mj-section>
                </mj-body>
            </mjml>
        `;
        const transporter = nodemailer.createTransport({  
            service: 'Gmail',  
            auth: {
                user: "", 
                pass: ""
            }
        });
    
        const { html } = mjml2html(mjmlTemplate);
    
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: toEmail,
            subject: 'Todo List Shared',
            html: html,
        });
    };

   
    fastify.post('/api/todos/share', async (request, reply) => {
        const { email, shareWith, mode } = request.body;
    
        
        const user = await collection.findOne({ email: email });
    
        
        const recipient = await collection.findOne({ email: shareWith });
    
        if (user && recipient) {
            
            await collection.updateOne(
                { email: email },
                { $push: { "todos.sharedWith": { userEmail: shareWith, mode: mode } } }
            );
            try {
                await sendEmail(shareWith, user.email, mode);
                reply.send({ message: 'Todo shared successfully and email sent.' });
            } catch (error) {
                console.error('Error sending email:', error);
                reply.send({ message: 'Todo shared successfully, but failed to send email.' });
            }
            reply.send({ message: 'Todo shared successfully' });
        } else if (!user) { 
            reply.status(400).send({ message: 'User not found' });
        } else if (!recipient) {
            reply.status(400).send({ message: 'Recipient not found' });
        }
    });
    
    

   
    fastify.delete('/api/todos/share/:shareWith', async (request, reply) => {
        const userEmail = request.query.email;
        const shareWithEmail = request.params.shareWith;
    
        const result = await collection.updateOne(
            { email: userEmail },
            { $pull: { "todos.sharedWith": { userEmail: shareWithEmail } } }
        );
    
        
        
        if (result.modifiedCount === 0) {
            return reply.status(404).send({ message: 'User not found or already removed.' });
        }
        return reply.send({ message: 'User unshared successfully!' });
    });
    
}