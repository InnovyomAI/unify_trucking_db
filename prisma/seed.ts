import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      driverProfiles: {
        create: {
          legalName: "John Doe",
          dob: new Date("1990-01-01"),
          email: "driver@example.com",
          phone: "123-456-7890",
          addressLine1: "123 Main St",
          city: "Winnipeg",
          region: "MB",
          postalCode: "R3C0X1",
          country: "CA",
          issuingJurisdiction: "CA-MB",
          licenseNo: "MB123456",
          licenseNoNorm: "MB123456",
          licenseClass: "Class 1",
          licenseExpiry: new Date("2030-01-01"),
          workEligibilityStatus: "ELIGIBLE",
          qrid: "demoqr123",
        },
      },
    },
  });

  console.log("Seeded user with driver profile:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
