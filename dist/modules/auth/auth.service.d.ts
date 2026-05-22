import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './services/token.service';
export declare class AuthService {
    private readonly usersRepository;
    private readonly tokenService;
    constructor(usersRepository: Repository<User>, tokenService: TokenService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            role: UserRole;
        };
    }>;
    private verifyGoogleToken;
    loginWithGoogle(googleAccessToken: string, role?: UserRole): Promise<{
        requiresRoleSelection: true;
        accessToken?: undefined;
        user?: undefined;
    } | {
        accessToken: string;
        user: {
            id: number;
            email: string;
            role: UserRole;
        };
        requiresRoleSelection?: undefined;
    }>;
}
