import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv[2] || 'sammagbo@gmail.com';

async function main() {
      console.log(`🚀 Promovendo o usuário ${email} para ADMIN...`);

      const user = await prisma.user.findUnique({
            where: { email }
      });

      if (!user) {
            console.error(`❌ Usuário com email ${email} não encontrado.`);
            process.exit(1);
      }

      const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { role: Role.ADMIN }
      });

      console.log(`✅ Sucesso! Usuário ${email} agora é ${updatedUser.role}.`);
}

main()
      .catch((e) => {
            console.error(e);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
      });
