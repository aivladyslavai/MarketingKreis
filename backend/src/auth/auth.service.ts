import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email)
    
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user
      return result
    }
    return null
  }

  async login(loginDto: { email: string; password: string }) {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      access_token: this.jwtService.sign(payload),
    }
  }

  async register(registerDto: {
    email: string
    password: string
    name?: string
  }) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new UnauthorizedException('User already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)

    // Create user
    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: 'VIEWER', // Default role
    })

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      access_token: this.jwtService.sign(payload),
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token)
      const user = await this.usersService.findOne(payload.sub)
      
      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      return user
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}