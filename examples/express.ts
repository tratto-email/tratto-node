/**
 * Example: Express route that sends a password-reset email.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/express.ts
 *   curl -X POST localhost:3000/password-reset -H 'content-type: application/json' \
 *     -d '{"email":"user@example.com","resetUrl":"https://acme.com/reset/abc123"}'
 */
import express from 'express';
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);
const app = express();
app.use(express.json());

app.post('/password-reset', async (req, res) => {
  const { email, resetUrl } = req.body as { email: string; resetUrl: string };

  try {
    const { id } = await tratto.emails.send({
      from: 'Acme <hello@mail.acme.com>',
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
    res.status(200).json({ id });
  } catch (err) {
    if (err instanceof TrattoError) {
      res.status(err.statusCode).json({ code: err.code, message: err.message });
      return;
    }
    throw err;
  }
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
