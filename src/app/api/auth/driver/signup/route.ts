import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const VALID_VEHICLE_TYPES = ['SEDAN', 'SUV', 'VAN', 'LUXURY'] as const;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const {
      name, email, password, phone,
      licenseNumber, vehiclePlate, vehicleModel, vehicleYear, vehicleColor, vehicleType,
      homeAirport, pickupPoint,
    } = data;

    if (!name || !email || !password || !phone || !licenseNumber || !vehiclePlate || !vehicleModel || !vehicleYear || !vehicleColor || !vehicleType || !homeAirport || !pickupPoint) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    const normalizedVehicleType = vehicleType.toUpperCase();
    if (!VALID_VEHICLE_TYPES.includes(normalizedVehicleType as typeof VALID_VEHICLE_TYPES[number])) {
      return NextResponse.json({ error: 'Tipo veicolo non valido' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
    }

    const existingLicense = await prisma.driver.findUnique({ where: { licenseNumber } });
    if (existingLicense) {
      return NextResponse.json({ error: 'Numero patente già registrato' }, { status: 409 });
    }

    const existingPlate = await prisma.driver.findUnique({ where: { vehiclePlate: vehiclePlate.toUpperCase() } });
    if (existingPlate) {
      return NextResponse.json({ error: 'Targa già registrata' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'DRIVER',
        driver: {
          create: {
            licenseNumber,
            vehiclePlate: vehiclePlate.toUpperCase(),
            vehicleModel,
            vehicleYear: parseInt(vehicleYear, 10),
            vehicleColor,
            vehicleType: normalizedVehicleType as typeof VALID_VEHICLE_TYPES[number],
            homeAirport: homeAirport.toUpperCase(),
            pickupPoint: pickupPoint.trim(),
            isVerified: false,
          },
        },
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Candidatura ricevuta! Il tuo account verrà verificato entro 2-3 giorni lavorativi.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Driver signup error:', error);
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}
