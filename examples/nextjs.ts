/**
 * Example: Next.js App Router route handler that sends a welcome email.
 *
 * Drop this in `app/api/welcome/route.ts`, set TRATTO_API_KEY in your
 * environment, and POST { "email": "user@example.com", "name": "Alice" }.
 */
import { Tratto, TrattoError } from '../src/index';

const tratto = new Tratto(process.env['TRATTO_API_KEY']!);

export async function POST(request: Request) {
  const { email, name } = (await request.json()) as { email: string; name: string };

  try {
    const { id } = await tratto.emails.send(
      {
        from: 'Acme <hello@mail.acme.com>',
        to: email,
        subject: `Welcome, ${name}!`,
        html: `<h1>Welcome, ${name}!</h1><p>Thanks for signing up.</p>`,
      },
      // Idempotency key ties the send to the signup event, so retries
      // (client timeouts, Next.js re-invocations) never double-send.
      `welcome-${email}`,
    );
    return Response.json({ id }, { status: 200 });
  } catch (err) {
    if (err instanceof TrattoError) {
      return Response.json({ code: err.code, message: err.message }, { status: err.statusCode });
    }
    throw err;
  }
}
