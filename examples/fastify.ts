/**
 * Example: Fastify route that sends an order-confirmation email via a
 * saved template.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/fastify.ts
 *   curl -X POST localhost:3000/order-confirmation -H 'content-type: application/json' \
 *     -d '{"email":"user@example.com","orderId":"ord_123","amount":"$49.00"}'
 */
import Fastify from 'fastify';
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);
const fastify = Fastify();

fastify.post('/order-confirmation', async (request, reply) => {
  const { email, orderId, amount } = request.body as {
    email: string;
    orderId: string;
    amount: string;
  };

  try {
    const { id } = await tratto.emails.send(
      {
        from: 'Acme <hello@mail.acme.com>',
        to: email,
        subject: 'Your order is confirmed',
        templateId: 'tpl_order_confirmation',
        variables: { orderId, amount },
      },
      // Idempotency key ties the send to the order, so a retried request
      // never double-sends the confirmation.
      `order-confirmation-${orderId}`,
    );
    return reply.status(200).send({ id });
  } catch (err) {
    if (err instanceof TrattoError) {
      return reply.status(err.statusCode).send({ code: err.code, message: err.message });
    }
    throw err;
  }
});

fastify.listen({ port: 3000 }, () => console.log('Listening on http://localhost:3000'));
