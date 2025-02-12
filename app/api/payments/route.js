import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Appointment from '@/backend/models/Appointment';
import { authMiddleware } from '@/backend/middleware/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { appointmentId } = body;

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'profile consultationFee');

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.patientId.toString() !== req.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create Stripe payment session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Consultation with Dr. ${appointment.doctorId.profile.name}`,
              description: `Appointment on ${new Date(appointment.dateTime).toLocaleString()}`,
            },
            unit_amount: appointment.paymentAmount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/appointments/${appointmentId}/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/appointments/${appointmentId}/cancel`,
      metadata: {
        appointmentId: appointmentId.toString(),
        patientId: req.user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Payment Creation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 