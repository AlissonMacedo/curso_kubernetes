import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { z } from 'zod'

const createQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
})

const bodyBalidationPipe = new ZodValidationPipe(createQuestionBodySchema)

type CreateQuestionBodySchema = z.infer<typeof createQuestionBodySchema>

@Controller('/questions')
@UseGuards(AuthGuard('jwt'))
export class CreateQuestionController {
  constructor(private prisma: PrismaService) { }

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyBalidationPipe) body: CreateQuestionBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { title, content } = body
    const { sub: userId } = user

    const slug = this.convertToSlug(title)

    await this.prisma.question.create({
      data: {
        authorId: userId,
        title,
        content,
        slug,
      },
    })
  }

  public convertToSlug(title: string): string {
    return title
      .normalize('NFD') // Normalize using Unicode normalization form NFD
      .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
      .replace(/[^\w\s-]/g, '') // Remove non-word characters (except spaces and dashes)
      .replace(/ /g, '-') // Replace spaces with dashes
      .replace(/[-]+/g, '-') // Replace multiple dashes with a single dash
      .toLowerCase() // Convert to lowercase (optional, for consistency)
  }
}
