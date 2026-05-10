import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userData } = dto;
    return this.authService.register(userData);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  getProfile(
    @Req()
    req: {
      user: {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    },
  ) {
    return {
      email: req.user.email,
      name: req.user.firstName,
      lastName: req.user.lastName,
    };
  }
}
