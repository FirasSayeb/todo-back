import { userSchema } from "../schemas/userSchema.js";
import  mjml2html from 'mjml'; 
import nodemailer from 'nodemailer';

export default async function auth(fastify, options){
  const collection = fastify.mongo.db.collection('users')
    
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
        const user = await collection.findOne({ email: request.body.email, password: request.body.password });

        if (!user) {
            return reply.status(401).send({ message: 'Invalid email or password' });
        }

       
        const { password, ...userWithoutPassword } = user;
        return reply.send(userWithoutPassword); 
    } catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error', error: error.message });
    }
});


  
  fastify.post('/api/auth/signup', { schema: userSchema }, async (request, reply) => {
    
        const { email, password, role } = request.body;

        
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return reply.status(400).send({ message: 'User already exists' });
        }

       
        return  result = await collection.insertOne({ email, password, role });
        
   
});

  fastify.post('/api/auth/reset-password' ,async (request, reply) => {
    
    const { email } = request.body;

    
    const user = await collection.findOne({ email });
    if (!user) {
        return reply.status(404).send({ error: 'User not found' });
    }

    const resetUrl = `http://localhost:3000/auth/update-password`;

    
    const mjmlTemplate = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="20px" font-family="Helvetica" color="#626262">
                Reset Your Password
              </mj-text>
              <mj-text font-size="16px" color="#626262">
                Please click the link below to reset your password:
              </mj-text>
              <mj-button href="${resetUrl}" background-color="#F45E43" color="white">
                Reset Password
              </mj-button>
              <mj-text font-size="12px" color="#626262">
                If you did not request this, please ignore this email.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>`;

   
    const { html } = mjml2html(mjmlTemplate);

    
    const transporter = nodemailer.createTransport({  
        service: 'Gmail',  
        auth: {
            user: "firassayeb2@gmail.com",
            pass: "sbdghguypdoyjizl"
        }
    });

    
    const mailOptions = {
        from: 'firassayeb2@gmail.com',
        to: user.email,
        subject: 'Password Reset Request',
        html
    };

    
    try {
        await transporter.sendMail(mailOptions);
        return reply.send({ message: 'Reset password email sent' });
    } catch (error) {
        return reply.status(500).send({ error: 'Failed to send reset email' });
    }
  })

  fastify.post('/api/auth/update-password',async (request, reply) => {
    
    const result=await collection.updateOne({email:request.body.email},{$set:{password:request.body.password}})
    if (result.length === 0) {
      throw new Error('No documents found')
    }
    return result
  })
  

}