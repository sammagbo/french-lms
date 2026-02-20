import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
      console.log('🌱 Iniciando o Seeding da Base de Dados (French A1)...');

      // 1. Password Genérica
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('123456', saltRounds);

      // 2. Criar ou Obter o Professor (Admin)
      console.log('👤 Criando usuário Professor...');
      const teacher = await prisma.user.upsert({
            where: { email: 'prof@french.com' },
            update: {},
            create: {
                  email: 'prof@french.com',
                  passwordHash,
                  role: Role.TEACHER,
                  profile: {
                        create: {
                              bio: 'Professor Nativo de Francês.',
                              frenchLevel: 'C2',
                        },
                  },
            },
      });

      // 3. Criar ou Obter o Aluno
      console.log('👤 Criando usuário Aluno...');
      const student = await prisma.user.upsert({
            where: { email: 'aluno@french.com' },
            update: {},
            create: {
                  email: 'aluno@french.com',
                  passwordHash,
                  role: Role.STUDENT,
                  profile: {
                        create: {
                              bio: 'Estudante iniciante de Francês.',
                              frenchLevel: 'A1',
                        },
                  },
            },
      });

      // 4. Criar o Curso
      console.log('📚 Criando o Curso "Francês Essencial"...');

      // Limpar curso se já existir (para evitar duplicações em seeds repetidos não-upsertáveis, embora o course seja upsertável, mas os relations nested podem causar dores de cabeça se não os mapearmos 1:1, mas vamos tentar com UPSERT simples primeiro na root). E apagar e recriar para garantir limpeza.
      await prisma.activity.deleteMany({ where: { title: 'Prática de Pronúncia: Apresentação' } });
      await prisma.course.deleteMany({ where: { slug: 'frances-essencial-a1' } });

      const course = await prisma.course.create({
            data: {
                  title: 'Francês Essencial: Do Zero à Primeira Conversa',
                  slug: 'frances-essencial-a1',
                  description: 'O curso definitivo para quem quer dar os primeiros passos no idioma francês de forma imersiva e natural.',
                  price: 0,
                  authorId: teacher.id,
                  modules: {
                        create: [
                              // Módulo 1
                              {
                                    title: 'Módulo 1: Les Salutations (Saudações)',
                                    lessons: {
                                          create: [
                                                {
                                                      title: 'Aula 1: Bonjour e Bonsoir',
                                                      content: `
# Bem-vindo(a) à sua primeira aula!

Aprender a cumprimentar é o primeiro passo para qualquer conversa em francês.

### Qual a diferença?
*   **Bonjour:** Significa literalmente "Bom dia", mas é traduzido como "Olá" e usado até ao final da tarde (cerca das 18h).
*   **Bonsoir:** É o "Boa noite" que dizemos quando chegamos a um local ou cumprimentamos alguém a partir do pôr do sol.

Assista ao vídeo abaixo para treinar a sua pronúncia com um professor nativo!
                  `,
                                                      videoUrl: 'https://www.youtube.com/watch?v=FjH30SCA1H0', // Exemplo didático público
                                                },
                                          ],
                                    },
                              },
                              // Módulo 2
                              {
                                    title: 'Módulo 2: Se Présenter (Apresentar-se)',
                                    lessons: {
                                          create: [
                                                {
                                                      title: 'Aula 1: Os Verbos Être e Avoir',
                                                      content: `
# A Base do Idioma

Os verbos **Être** (Ser/Estar) e **Avoir** (Ter) são as espinhas dorsais da língua francesa.

*   **Je suis** (Eu sou/estou)
*   **J'ai** (Eu tenho)

Vamos explorar como utilizá-los numa pequena apresentação pessoal no vídeo desta aula.
                  `,
                                                      videoUrl: 'https://www.youtube.com/watch?v=qE4ZqQ_E7sU',
                                                }
                                          ]
                                    }
                              }
                        ],
                  },
            },
      });

      console.log('✅ Curso e Módulos criados com sucesso.');

      // 5. Criar uma Atividade vinculada à Aula (Módulo 2, Aula 1)
      const lessonVerbs = await prisma.lesson.findFirst({
            where: { title: 'Aula 1: Os Verbos Être e Avoir', module: { courseId: course.id } }
      });

      if (lessonVerbs) {
            console.log('📝 Criando a Atividade de Pronúncia...');
            await prisma.activity.create({
                  data: {
                        title: 'Prática de Pronúncia: Apresentação',
                        description: "Grave um áudio ou escreva: Je m'appelle [Nome], je suis brésilien(ne) et j'habite à [Cidade].",
                        lessonId: lessonVerbs.id,
                        authorId: teacher.id,
                  },
            });
      }

      console.log('🎉 Seeding concluído com sucesso!');
}

main()
      .catch((e) => {
            console.error('❌ Erro durante o seeding:', e);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
      });
