import crypto from "node:crypto";
import {
  AvailabilityStatus,
  ConnectionDirection,
  ConnectionStatus,
  DocumentStatus,
  DocumentType,
  PrismaClient,
  RequestKind,
  RequestStatus,
  ReviewAuthorType,
  ReviewTargetType,
  Role,
  ServiceType,
  TripType,
  VehicleType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const R = ServiceType.TVDE_RIDES;
const T = ServiceType.TOURS_AND_TRANSFERS;
const A = ServiceType.AIRPORT_TRANSFERS;
const C = ServiceType.CORPORATE_EVENTS;

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
const hash = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
const token = () => hash(crypto.randomBytes(24).toString("hex"));

// ───────────── Reference data ─────────────

const languages = [
  { code: "pt", nameEn: "Portuguese", namePt: "Português", flag: "🇵🇹" },
  { code: "en", nameEn: "English", namePt: "Inglês", flag: "🇬🇧" },
  { code: "es", nameEn: "Spanish", namePt: "Espanhol", flag: "🇪🇸" },
  { code: "fr", nameEn: "French", namePt: "Francês", flag: "🇫🇷" },
  { code: "de", nameEn: "German", namePt: "Alemão", flag: "🇩🇪" },
  { code: "it", nameEn: "Italian", namePt: "Italiano", flag: "🇮🇹" },
  { code: "nl", nameEn: "Dutch", namePt: "Neerlandês", flag: "🇳🇱" },
  { code: "ru", nameEn: "Russian", namePt: "Russo", flag: "🇷🇺" },
  { code: "uk", nameEn: "Ukrainian", namePt: "Ucraniano", flag: "🇺🇦" },
  { code: "ar", nameEn: "Arabic", namePt: "Árabe", flag: "🇸🇦" },
  { code: "hi", nameEn: "Hindi", namePt: "Hindi", flag: "🇮🇳" },
  { code: "zh", nameEn: "Chinese", namePt: "Chinês", flag: "🇨🇳" },
];

const highlightedRegions = ["Lisboa", "Porto", "Faro", "Madeira", "Açores"];
const regionNames = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro",
  "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal",
  "Viana do Castelo", "Vila Real", "Viseu", "Madeira", "Açores",
];

const cities: Array<[string, string]> = [
  ["Lisboa", "Lisboa"], ["Cascais", "Lisboa"], ["Sintra", "Lisboa"], ["Oeiras", "Lisboa"],
  ["Amadora", "Lisboa"], ["Porto", "Porto"], ["Vila Nova de Gaia", "Porto"],
  ["Matosinhos", "Porto"], ["Braga", "Braga"], ["Guimarães", "Braga"],
  ["Coimbra", "Coimbra"], ["Aveiro", "Aveiro"], ["Faro", "Faro"], ["Albufeira", "Faro"],
  ["Lagos", "Faro"], ["Portimão", "Faro"], ["Tavira", "Faro"], ["Funchal", "Madeira"],
  ["Ponta Delgada", "Açores"], ["Évora", "Évora"], ["Setúbal", "Setúbal"],
  ["Leiria", "Leiria"], ["Viseu", "Viseu"], ["Viana do Castelo", "Viana do Castelo"],
];

// ───────────── Sample people & companies ─────────────

type VehicleSeed = [make: string, model: string, year: number, type: VehicleType];

type DriverSeed = {
  name: string;
  city: string;
  langs: string[];
  years: number;
  services: ServiceType[];
  vehicle: VehicleSeed;
  verified: boolean;
  availability?: AvailabilityStatus;
};

const drivers: DriverSeed[] = [
  { name: "João Silva", city: "Lisboa", langs: ["pt", "en"], years: 8, services: [R, A], vehicle: ["Toyota", "Corolla Hybrid", 2021, "STANDARD"], verified: true },
  { name: "Miguel Santos", city: "Lisboa", langs: ["pt", "en", "es"], years: 5, services: [R, A, T], vehicle: ["Skoda", "Octavia", 2020, "STANDARD"], verified: true },
  { name: "Rui Ferreira", city: "Porto", langs: ["pt", "en", "fr"], years: 11, services: [R, A, C], vehicle: ["Mercedes-Benz", "E 220", 2022, "PREMIUM"], verified: true },
  { name: "André Costa", city: "Porto", langs: ["pt", "en"], years: 3, services: [R], vehicle: ["Hyundai", "Ioniq 5", 2023, "ELECTRIC"], verified: false },
  { name: "Tiago Oliveira", city: "Faro", langs: ["pt", "en", "de"], years: 7, services: [A, T], vehicle: ["Mercedes-Benz", "V-Class", 2021, "VAN_MPV"], verified: true },
  { name: "Pedro Almeida", city: "Albufeira", langs: ["pt", "en", "nl"], years: 6, services: [A, T], vehicle: ["Volkswagen", "Touran", 2020, "VAN_MPV"], verified: true },
  { name: "Nuno Carvalho", city: "Lagos", langs: ["pt", "en", "de"], years: 9, services: [T, A], vehicle: ["Mercedes-Benz", "Vito Tourer", 2022, "VAN_MPV"], verified: true },
  { name: "Ricardo Pinto", city: "Cascais", langs: ["pt", "en", "fr"], years: 10, services: [C, A, T], vehicle: ["Mercedes-Benz", "S 350", 2022, "PREMIUM"], verified: true },
  { name: "Hugo Martins", city: "Sintra", langs: ["pt", "en"], years: 4, services: [T, R], vehicle: ["Tesla", "Model 3", 2022, "ELECTRIC"], verified: false },
  { name: "Carlos Rocha", city: "Braga", langs: ["pt", "es"], years: 12, services: [R, A], vehicle: ["Peugeot", "508", 2019, "STANDARD"], verified: true },
  { name: "Sofia Mendes", city: "Lisboa", langs: ["pt", "en", "it"], years: 6, services: [R, T], vehicle: ["BMW", "i4", 2023, "ELECTRIC"], verified: true },
  { name: "Marta Lopes", city: "Coimbra", langs: ["pt", "en"], years: 2, services: [R], vehicle: ["Renault", "Clio", 2021, "STANDARD"], verified: false },
  { name: "Inês Duarte", city: "Funchal", langs: ["pt", "en", "de"], years: 8, services: [T, A], vehicle: ["Toyota", "Proace Verso", 2021, "VAN_MPV"], verified: true },
  { name: "Ahmed Khan", city: "Lisboa", langs: ["en", "pt", "ar", "hi"], years: 5, services: [R, A], vehicle: ["Kia", "Niro EV", 2022, "ELECTRIC"], verified: true },
  { name: "Oleksandr Melnyk", city: "Setúbal", langs: ["uk", "ru", "en", "pt"], years: 4, services: [R, A], vehicle: ["Skoda", "Superb", 2020, "STANDARD"], verified: false },
  { name: "Maria Rodrigues", city: "Ponta Delgada", langs: ["pt", "en", "es"], years: 9, services: [T, A], vehicle: ["Mercedes-Benz", "V 250", 2020, "VAN_MPV"], verified: true },
  { name: "Rafael Gomes", city: "Matosinhos", langs: ["pt", "en"], years: 6, services: [A, C], vehicle: ["Audi", "A6", 2021, "PREMIUM"], verified: true },
  { name: "Diego Fernández", city: "Faro", langs: ["es", "pt", "en"], years: 7, services: [R, A], vehicle: ["Seat", "León", 2021, "STANDARD"], verified: false },
  { name: "Jean-Luc Moreau", city: "Lisboa", langs: ["fr", "en", "pt"], years: 13, services: [C, T, A], vehicle: ["Mercedes-Benz", "E 300 e", 2022, "PREMIUM"], verified: true },
  { name: "Bruno Teixeira", city: "Guimarães", langs: ["pt", "en"], years: 3, services: [R, A], vehicle: ["Toyota", "Prius", 2020, "STANDARD"], verified: false },
];

type FleetSeed = {
  name: string;
  city: string;
  langs: string[];
  services: ServiceType[];
  vehicles: VehicleSeed[];
  verified: boolean;
  terms: string;
  description: string;
};

const fleets: FleetSeed[] = [
  { name: "Lisboa Premium Rides, Lda", city: "Lisboa", langs: ["pt", "en", "fr", "es"], services: [R, A, C], verified: true, vehicles: [["Mercedes-Benz", "E 220", 2022, "PREMIUM"], ["Toyota", "Corolla Hybrid", 2021, "STANDARD"], ["Mercedes-Benz", "V-Class", 2022, "VAN_MPV"]], terms: "Comissão de 6% sobre viagens. Pagamento semanal.", description: "Frota premium em Lisboa para transferes de aeroporto e eventos corporativos." },
  { name: "Porto Urban Mobility", city: "Porto", langs: ["pt", "en", "es", "fr"], services: [R, A], verified: true, vehicles: [["Hyundai", "Ioniq 5", 2023, "ELECTRIC"], ["Skoda", "Octavia", 2021, "STANDARD"]], terms: "Aluguer semanal de viatura disponível. Seguro incluído.", description: "Mobilidade urbana no Grande Porto com forte aposta em veículos elétricos." },
  { name: "Algarve Sun Transfers", city: "Faro", langs: ["pt", "en", "de", "nl"], services: [A, T], verified: true, vehicles: [["Mercedes-Benz", "Vito Tourer", 2022, "VAN_MPV"], ["Volkswagen", "Touran", 2021, "VAN_MPV"], ["Toyota", "Camry", 2020, "STANDARD"]], terms: "Trabalho sazonal e anual. Bónus em época alta.", description: "Transferes e passeios em todo o Algarve para turistas de toda a Europa." },
  { name: "Madeira Island Drivers", city: "Funchal", langs: ["pt", "en", "de"], services: [T, A], verified: true, vehicles: [["Toyota", "Proace Verso", 2021, "VAN_MPV"], ["Dacia", "Jogger", 2022, "VAN_MPV"]], terms: "Horários flexíveis. Formação de guia local oferecida.", description: "Tours e transferes na ilha da Madeira, com motoristas que conhecem cada curva." },
  { name: "Açores Ride Co.", city: "Ponta Delgada", langs: ["pt", "en"], services: [T, A], verified: false, vehicles: [["Mercedes-Benz", "V 250", 2020, "VAN_MPV"]], terms: "Parceria a recibo verde. Pagamento quinzenal.", description: "Transferes e visitas em São Miguel." },
  { name: "Coimbra Executive Cars", city: "Coimbra", langs: ["pt", "en", "fr"], services: [R, C], verified: false, vehicles: [["BMW", "Série 5", 2021, "PREMIUM"], ["Renault", "Mégane E-Tech", 2023, "ELECTRIC"]], terms: "Comissão de 8%. Apoio na documentação TVDE.", description: "Serviço executivo na região Centro." },
  { name: "Cascais Coast Chauffeurs", city: "Cascais", langs: ["pt", "en", "fr", "it"], services: [C, T, A], verified: true, vehicles: [["Mercedes-Benz", "S 350", 2022, "PREMIUM"], ["Tesla", "Model 3", 2022, "ELECTRIC"], ["Mercedes-Benz", "V-Class", 2021, "VAN_MPV"]], terms: "Foco em clientela premium. Fardamento fornecido.", description: "Motoristas profissionais na linha de Cascais e Sintra." },
  { name: "Minho Transfers", city: "Braga", langs: ["pt", "en", "es"], services: [R, A, T], verified: false, vehicles: [["Peugeot", "508", 2020, "STANDARD"], ["Citroën", "Berlingo", 2021, "VAN_MPV"]], terms: "Pagamento semanal. Turnos flexíveis.", description: "Transferes e viagens TVDE em Braga, Guimarães e Viana do Castelo." },
];

// Which fleet a driver's city belongs to
const cityToFleet: Record<string, string> = {
  Lisboa: "Lisboa Premium Rides, Lda", Porto: "Porto Urban Mobility", Matosinhos: "Porto Urban Mobility",
  Faro: "Algarve Sun Transfers", Albufeira: "Algarve Sun Transfers", Lagos: "Algarve Sun Transfers",
  Funchal: "Madeira Island Drivers", "Ponta Delgada": "Açores Ride Co.", Coimbra: "Coimbra Executive Cars",
  Cascais: "Cascais Coast Chauffeurs", Sintra: "Cascais Coast Chauffeurs",
  Braga: "Minho Transfers", Guimarães: "Minho Transfers", Setúbal: "Lisboa Premium Rides, Lda",
};

const driverComments = [
  "Pontual, simpático e carro impecável.", "Excelente conhecimento da cidade.",
  "Muito profissional e comunicativo.", "Viagem confortável e segura.",
  "Recomendo vivamente.", "Great driver, very polite.",
];
const fleetComments = [
  "Pagamentos sempre a horas.", "Ótima equipa e boa comunicação.",
  "Frota bem cuidada e organizada.", "Great company to work with.",
];

const ratingPattern = [5, 5, 4, 5, 4, 3, 5, 4];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production.");
  }

  console.log("🧹 Clearing existing data…");
  await prisma.review.deleteMany();
  await prisma.requestReply.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.customerRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driverLanguage.deleteMany();
  await prisma.fleetLanguage.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.fleetProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.city.deleteMany();
  await prisma.region.deleteMany();
  await prisma.language.deleteMany();
  await prisma.siteSettings.deleteMany();

  console.log("🌍 Reference data…");
  await prisma.language.createMany({ data: languages });
  const langName = new Map(languages.map((l) => [l.code, l.namePt]));

  const regionByName = new Map<string, { id: string }>();
  for (const [i, name] of regionNames.entries()) {
    const region = await prisma.region.create({
      data: {
        name,
        slug: slugify(name),
        highlighted: highlightedRegions.includes(name),
        sortOrder: highlightedRegions.includes(name) ? i : 100 + i,
      },
    });
    regionByName.set(name, region);
  }

  const cityByName = new Map<string, { id: string; regionId: string }>();
  for (const [name, regionName] of cities) {
    const regionId = regionByName.get(regionName)!.id;
    const city = await prisma.city.create({ data: { name, slug: slugify(name), regionId } });
    cityByName.set(name, { id: city.id, regionId });
  }

  await prisma.siteSettings.create({
    data: {
      id: "singleton",
      customerBookableServices: [R, T, A, C],
      directDriverBookingEnabled: true,
      fleetRequestsEnabled: true,
      generalRequestsEnabled: true,
    },
  });

  console.log("👤 Users…");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const sampleHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@tvdehub.pt",
      name: "Admin TVDE Hub",
      role: Role.ADMIN,
      passwordHash: adminHash,
      emailVerified: new Date(),
    },
  });

  console.log("🚗 Drivers…");
  const driverIds: string[] = [];
  const driverMeta: Array<{ id: string; seed: DriverSeed; userId: string }> = [];

  for (const [i, d] of drivers.entries()) {
    const slug = slugify(d.name);
    const user = await prisma.user.create({
      data: {
        email: `${slug}@example.com`,
        name: d.name,
        role: Role.DRIVER,
        passwordHash: sampleHash,
        emailVerified: new Date(),
      },
    });
    const city = cityByName.get(d.city)!;
    const profile = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        slug,
        displayName: d.name,
        bio: `Motorista TVDE com ${d.years} anos de experiência em ${d.city}. Atendimento em ${d.langs
          .map((c) => langName.get(c))
          .join(", ")}. Pontualidade e conforto em cada viagem.`,
        phone: `+3519100${String(i).padStart(4, "0")}`,
        cityId: city.id,
        serviceAreas: { connect: [{ id: city.regionId }] },
        yearsExperience: d.years,
        serviceTypes: d.services,
        availability: d.availability ?? (i % 7 === 0 ? AvailabilityStatus.BUSY : AvailabilityStatus.AVAILABLE),
        isPublished: true,
        verified: d.verified,
        completeness: d.verified ? 100 : 70,
        languages: { create: d.langs.map((languageCode) => ({ languageCode })) },
        vehicles: {
          create: {
            make: d.vehicle[0],
            model: d.vehicle[1],
            year: d.vehicle[2],
            type: d.vehicle[3],
            seats: d.vehicle[3] === "VAN_MPV" ? 7 : 4,
          },
        },
      },
    });
    driverIds.push(profile.id);
    driverMeta.push({ id: profile.id, seed: d, userId: user.id });

    // Documents: verified drivers have approved docs; others have a pending one.
    await prisma.document.create({
      data: {
        type: DocumentType.TVDE_DRIVER_CERTIFICATE,
        status: d.verified ? DocumentStatus.APPROVED : DocumentStatus.PENDING,
        number: `CMT-${100000 + i * 137}`,
        expiresAt: daysFromNow(d.verified ? 200 + i * 10 : 365),
        fileKey: "seed/placeholder-private.pdf",
        fileName: "certificado-tvde.pdf",
        mimeType: "application/pdf",
        sizeBytes: 120_000,
        uploadedById: user.id,
        driverId: profile.id,
        reviewedById: d.verified ? admin.id : null,
        reviewedAt: d.verified ? new Date() : null,
      },
    });
  }

  console.log("🏢 Fleets…");
  const fleetIdByName = new Map<string, string>();
  const fleetUserByName = new Map<string, string>();

  for (const [i, f] of fleets.entries()) {
    const slug = slugify(f.name);
    const user = await prisma.user.create({
      data: {
        email: `${slug}@example.com`,
        name: f.name,
        role: Role.FLEET,
        passwordHash: sampleHash,
        emailVerified: new Date(),
      },
    });
    const city = cityByName.get(f.city)!;
    const profile = await prisma.fleetProfile.create({
      data: {
        userId: user.id,
        slug,
        companyName: f.name,
        description: f.description,
        website: `https://www.${slug}.example.pt`,
        contactEmail: `geral@${slug}.example.pt`,
        phone: `+351210${String(i).padStart(6, "0")}`,
        nif: `5${String(10000000 + i * 4321).slice(0, 8)}`,
        operatorLicenceNumber: `LIC-${2000 + i * 11}`,
        cityId: city.id,
        serviceAreas: { connect: [{ id: city.regionId }] },
        serviceTypes: f.services,
        termsOffered: f.terms,
        isPublished: true,
        verified: f.verified,
        completeness: f.verified ? 100 : 75,
        languages: { create: f.langs.map((languageCode) => ({ languageCode })) },
        vehicles: {
          create: f.vehicles.map(([make, model, year, type]) => ({
            make,
            model,
            year,
            type,
            seats: type === "VAN_MPV" ? 7 : 4,
          })),
        },
      },
    });
    fleetIdByName.set(f.name, profile.id);
    fleetUserByName.set(f.name, user.id);

    await prisma.document.create({
      data: {
        type: DocumentType.TVDE_OPERATOR_LICENCE,
        status: f.verified ? DocumentStatus.APPROVED : DocumentStatus.PENDING,
        number: `LIC-${2000 + i * 11}`,
        expiresAt: daysFromNow(f.verified ? 400 : 365),
        fileKey: "seed/placeholder-private.pdf",
        fileName: "licenca-operador.pdf",
        mimeType: "application/pdf",
        sizeBytes: 180_000,
        uploadedById: user.id,
        fleetId: profile.id,
        reviewedById: f.verified ? admin.id : null,
        reviewedAt: f.verified ? new Date() : null,
      },
    });
  }

  console.log("🤝 Connections & reviews…");
  for (const [i, dm] of driverMeta.entries()) {
    const fleetName = cityToFleet[dm.seed.city];
    if (!fleetName) continue;
    const fleetId = fleetIdByName.get(fleetName)!;
    const accepted = dm.seed.verified;

    const connection = await prisma.connection.create({
      data: {
        driverId: dm.id,
        fleetId,
        direction: i % 2 === 0 ? ConnectionDirection.APPLICATION : ConnectionDirection.INVITATION,
        status: accepted ? ConnectionStatus.ACCEPTED : ConnectionStatus.PENDING,
        message: accepted ? "Bem-vindo à equipa!" : "Gostaria de integrar a vossa frota.",
        activeKey: `${dm.id}:${fleetId}`,
        respondedAt: accepted ? new Date() : null,
        expiresAt: accepted ? null : daysFromNow(14),
      },
    });

    if (accepted) {
      const fleetOwner = fleets.find((f) => f.name === fleetName)!;
      await prisma.review.create({
        data: {
          rating: ratingPattern[i % ratingPattern.length]!,
          comment: driverComments[i % driverComments.length],
          authorType: ReviewAuthorType.FLEET,
          authorName: fleetOwner.name,
          authorUserId: fleetUserByName.get(fleetName),
          targetType: ReviewTargetType.DRIVER,
          driverId: dm.id,
          connectionId: connection.id,
        },
      });
      await prisma.review.create({
        data: {
          rating: ratingPattern[(i + 3) % ratingPattern.length]!,
          comment: fleetComments[i % fleetComments.length],
          authorType: ReviewAuthorType.DRIVER,
          authorName: dm.seed.name,
          authorUserId: dm.userId,
          targetType: ReviewTargetType.FLEET,
          fleetId,
          connectionId: connection.id,
        },
      });
    }
  }

  console.log("📨 Customer requests…");
  const lisbonFleetId = fleetIdByName.get("Lisboa Premium Rides, Lda")!;
  const lisbonFleetUserId = fleetUserByName.get("Lisboa Premium Rides, Lda")!;

  const completed: Array<{ driverIdx: number; name: string; email: string; rating: number; comment: string }> = [
    { driverIdx: 0, name: "Emma Wilson", email: "emma.wilson@example.com", rating: 5, comment: "Perfect airport transfer, thank you João!" },
    { driverIdx: 4, name: "Hans Müller", email: "hans.mueller@example.com", rating: 5, comment: "Sehr freundlich und pünktlich." },
    { driverIdx: 7, name: "Hotel Atlântico", email: "reservas@hotelatlantico.example.com", rating: 4, comment: "Serviço excelente para os nossos hóspedes." },
  ];

  for (const [i, c] of completed.entries()) {
    const dm = driverMeta[c.driverIdx]!;
    const request = await prisma.customerRequest.create({
      data: {
        kind: RequestKind.DIRECT_DRIVER,
        status: RequestStatus.COMPLETED,
        trackingTokenHash: token(),
        emailVerifiedAt: daysFromNow(-20),
        customerName: c.name,
        customerEmail: c.email,
        customerPhone: `+3519200${String(i).padStart(4, "0")}`,
        locale: i === 0 ? "en" : "pt",
        pickupAt: daysFromNow(-10 - i),
        pickupLocation: "Aeroporto Humberto Delgado",
        destination: "Centro da cidade",
        tripType: TripType.ONE_WAY,
        passengers: 2 + i,
        luggage: 2,
        languageCode: i === 1 ? "de" : "en",
        vehicleType: VehicleType.STANDARD,
        serviceType: A,
        targetDriverId: dm.id,
      },
    });
    await prisma.assignment.create({
      data: {
        requestId: request.id,
        driverId: dm.id,
        assignedById: dm.userId,
        status: "COMPLETED",
        completedAt: daysFromNow(-9 - i),
      },
    });
    await prisma.review.create({
      data: {
        rating: c.rating,
        comment: c.comment,
        authorType: ReviewAuthorType.CUSTOMER,
        authorName: c.name,
        targetType: ReviewTargetType.DRIVER,
        driverId: dm.id,
        requestId: request.id,
      },
    });
  }

  await prisma.customerRequest.create({
    data: {
      kind: RequestKind.GENERAL,
      status: RequestStatus.OPEN,
      trackingTokenHash: token(),
      emailVerifiedAt: new Date(),
      customerName: "Sofia & Daniel Events",
      customerEmail: "events@example.com",
      customerPhone: "+351912000111",
      pickupAt: daysFromNow(12),
      pickupLocation: "Hotel Avenida Palace, Lisboa",
      destination: "Quinta da Regaleira, Sintra",
      tripType: TripType.BY_THE_HOUR,
      hours: 6,
      passengers: 6,
      luggage: 0,
      languageCode: "en",
      vehicleType: VehicleType.VAN_MPV,
      serviceType: C,
      notes: "Evento corporativo. Preferimos motorista com experiência em eventos.",
    },
  });

  const replied = await prisma.customerRequest.create({
    data: {
      kind: RequestKind.FLEET,
      status: RequestStatus.REPLIED,
      trackingTokenHash: token(),
      emailVerifiedAt: new Date(),
      customerName: "Marie Dubois",
      customerEmail: "marie.dubois@example.com",
      customerPhone: "+33612345678",
      locale: "en",
      pickupAt: daysFromNow(5),
      pickupLocation: "Aeroporto Humberto Delgado",
      destination: "Hotel Four Seasons Ritz, Lisboa",
      tripType: TripType.ONE_WAY,
      passengers: 3,
      luggage: 4,
      languageCode: "fr",
      vehicleType: VehicleType.PREMIUM,
      serviceType: A,
      targetFleetId: lisbonFleetId,
    },
  });
  await prisma.requestReply.create({
    data: {
      requestId: replied.id,
      authorUserId: lisbonFleetUserId,
      fleetId: lisbonFleetId,
      message: "Bonjour Marie, nous avons un chauffeur francophone disponible. Prix fixe, attente incluse.",
      quoteCents: 4500,
    },
  });

  await prisma.customerRequest.create({
    data: {
      kind: RequestKind.DIRECT_DRIVER,
      status: RequestStatus.PENDING_VERIFICATION,
      verifyTokenHash: token(),
      trackingTokenHash: token(),
      customerName: "Luca Bianchi",
      customerEmail: "luca.bianchi@example.com",
      customerPhone: "+393331234567",
      locale: "en",
      pickupAt: daysFromNow(20),
      pickupLocation: "Porto, Estação de São Bento",
      destination: "Vale do Douro",
      tripType: TripType.BY_THE_HOUR,
      hours: 8,
      passengers: 4,
      luggage: 1,
      languageCode: "it",
      vehicleType: VehicleType.STANDARD,
      serviceType: T,
      targetDriverId: driverIds[2],
    },
  });

  console.log("📊 Rating aggregates…");
  const driverAgg = await prisma.review.groupBy({
    by: ["driverId"],
    where: { status: "PUBLISHED", driverId: { not: null } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const row of driverAgg) {
    if (!row.driverId) continue;
    await prisma.driverProfile.update({
      where: { id: row.driverId },
      data: {
        ratingAvg: Math.round((row._avg.rating ?? 0) * 10) / 10,
        ratingCount: row._count._all,
      },
    });
  }
  const fleetAgg = await prisma.review.groupBy({
    by: ["fleetId"],
    where: { status: "PUBLISHED", fleetId: { not: null } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const row of fleetAgg) {
    if (!row.fleetId) continue;
    await prisma.fleetProfile.update({
      where: { id: row.fleetId },
      data: {
        ratingAvg: Math.round((row._avg.rating ?? 0) * 10) / 10,
        ratingCount: row._count._all,
      },
    });
  }

  console.log("🔔 Sample notification…");
  await prisma.notification.create({
    data: {
      userId: driverMeta[0]!.userId,
      type: "SYSTEM",
      titleKey: "notifications.welcome",
      href: "/dashboard",
    },
  });

  console.log(`\n✅ Seed complete.
   Admin:   admin@tvdehub.pt / ${adminPassword}
   Samples: any <slug>@example.com / Password123!   (e.g. joao-silva@example.com)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());