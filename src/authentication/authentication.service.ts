import { UsersService } from './../users/users.service';
import { HttpException, HttpStatus, Injectable, Param } from '@nestjs/common';
import { CreateAuthenticationDto } from './dto/create-authentication.dto';
import { UpdateAuthenticationDto } from './dto/update-authentication.dto';
import RegisterDto from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import PostgresErrorCode from '../database/postgresErrorCode.enum'
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import TokenPayload from './interfaces/tokenPayload.interface';
@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
    ){

  }
  public async register(registrationData: RegisterDto){
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    try{
      const newUser={
        ...registrationData,
        password:hashedPassword
      };
      console.log(`New user -> ${newUser}`);
      
      const createdUser= await this.usersService.create(newUser);
      createdUser.password = undefined;
      return createdUser;
    }catch (error){
      if (error?.code === PostgresErrorCode.UniqueViolation){
        throw new HttpException('User with that email already exists', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public  async getAuthenticatedUser(email: string, plainTextPassword:string){
    try{
      const user = await  this.usersService.getByEmail(email);
      await this.verifyPassword(plainTextPassword, user.password);
      user.password=undefined;
      return user;
    }catch(error){
      throw new HttpException('Wrong credentials provided', HttpStatus.BAD_REQUEST);
    }
  }
  private async verifyPassword(plainTextPassword: string, hashedPassword:string){
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword
    );
    if (!isPasswordMatching){
      throw new HttpException('Wrong credentials provided', HttpStatus.BAD_REQUEST)
    }
  }

  public getCookieWithJwtToken(userId: number){
    const payload: TokenPayload={userId};
    const token =  this.jwtService.sign(payload);
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('JWT_EXPIRATION_TIME')} `
  }

  public getCookieForLogOut(){
    return `Authentication=; HttpOnly; Path=/; Max-Age=0`;
  }
  create(createAuthenticationDto: CreateAuthenticationDto) {
    return 'This action adds a new authentication';
  }

  findAll() {
    return `This action returns all authentication`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authentication`;
  }

  update(id: number, updateAuthenticationDto: UpdateAuthenticationDto) {
    return `This action updates a #${id} authentication`;
  }

  remove(id: number) {
    return `This action removes a #${id} authentication`;
  }
}
