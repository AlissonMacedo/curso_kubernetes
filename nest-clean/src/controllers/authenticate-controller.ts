import { Body, Controller, Post, UnauthorizedException, UsePipes } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { ZodValidationPipe } from 'src/pipes/zod-validation'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const authentcationBodySchema = z.object({
  email: z.string().email(),
  password: z.string()
})

type AuthencateBodySchema = z.infer<typeof authentcationBodySchema>

@Controller('/authentication')
export class AuthenticateController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService) {}
  @Post()
  @UsePipes(new ZodValidationPipe(authentcationBodySchema))
  async handle(@Body() body: AuthencateBodySchema){
    const { email, password } = body

    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if(!user) {
      throw new UnauthorizedException('User credential do not match.')
    }

    const isPasswordValid = await compare(password, user.password)

    if(!isPasswordValid) {
      throw new UnauthorizedException('User credential do not match.')
    }

    const acessToken = this.jwt.sign({ sub: user.id })

    return {
      acess_token: acessToken
    }
  }
}
