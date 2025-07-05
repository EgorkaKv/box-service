# Документация модуля авторизации (Auth Module)

## Общий обзор

Модуль авторизации (`AuthModule`) предназначен для аутентификации работников магазинов в системе BoxService. Модуль реализует простую схему авторизации, где все работники одного магазина используют общие учетные данные для входа в систему.

## Архитектура и принципы работы

### Основные компоненты

1. **Entity (StoreCredential)** - модель данных для хранения учетных данных
2. **Repository (AuthRepository)** - слой доступа к данным
3. **Service (AuthService)** - бизнес-логика авторизации
4. **Controller (AuthController)** - HTTP API endpoints
5. **Strategy (JwtStrategy)** - стратегия проверки JWT токенов
6. **Guard (JwtAuthGuard)** - защита маршрутов

### Принцип работы

1. **Единые учетные данные**: Все работники одного магазина используют один логин и пароль
2. **JWT аутентификация**: Используются access и refresh токены
3. **Защита от брутфорса**: Блокировка аккаунта после 5 неудачных попыток входа
4. **Автоматическая разблокировка**: Через 30 минут после последней неудачной попытки

## Подробное описание работы кода

### AuthController - HTTP API слой

**Файл: `src/auth/controllers/auth.controller.ts`**

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
```

**Описание работы:**
- **Декоратор `@Controller('auth')`** - определяет базовый путь для всех роутов в этом контроллере
- **Метод `login()`**:
  - Принимает `LoginDto` с логином и паролем через `@Body()`
  - Использует `@HttpCode(HttpStatus.OK)` для возврата статуса 200 вместо 201
  - Делегирует всю бизнес-логику сервису `AuthService`
  - Возвращает `AuthResponseDto` с токенами и данными пользователя
- **Метод `refreshToken()`**:
  - Принимает refresh токен из тела запроса
  - Передает токен в сервис для проверки и обновления
  - Возвращает новые access и refresh токены

**Принципы работы:**
- Контроллер служит только точкой входа для HTTP запросов
- Не содержит бизнес-логики - все делегируется сервису
- Использует DTO для типизации входных и выходных данных
- Применяет декораторы NestJS для маршрутизации и валидации

### AuthService - Бизнес-логика

**Файл: `src/auth/services/auth.service.ts`**

```typescript
@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 30 * 60 * 1000; // 30 минут

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
```

**Описание работы:**

#### 1. Инициализация и зависимости
- **Константы безопасности**: `MAX_LOGIN_ATTEMPTS` и `LOCKOUT_TIME` для защиты от брутфорса
- **Внедрение зависимостей**: `AuthRepository`, `JwtService`, `ConfigService`

#### 2. Метод `login()` - Основная логика авторизации

```typescript
async login(loginDto: LoginDto): Promise<AuthResponseDto> {
  const { login, password } = loginDto;

  // 1. Поиск учетных данных
  const storeCredential = await this.authRepository.findByLogin(login);
  if (!storeCredential) {
    throw new UnauthorizedException('Неверные учетные данные');
  }

  // 2. Проверка блокировки аккаунта
  if (this.isAccountLocked(storeCredential)) {
    throw new UnauthorizedException('Аккаунт заблокирован из-за превышения попыток входа');
  }

  // 3. Проверка пароля
  const isPasswordValid = await bcrypt.compare(password, storeCredential.passwordHash);
  if (!isPasswordValid) {
    await this.authRepository.incrementLoginAttempts(storeCredential.id);
    throw new UnauthorizedException('Неверные учетные данные');
  }

  // 4. Успешная авторизация
  await this.authRepository.updateLastLogin(storeCredential.id);

  // 5. Генерация токенов
  const payload = {
    sub: storeCredential.id,
    storeId: storeCredential.storeId,
    login: storeCredential.login,
    type: 'store_employee',
  };

  const accessToken = this.jwtService.sign(payload, {
    expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
  });

  const refreshToken = this.jwtService.sign(payload, {
    expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
  });

  return {
    accessToken,
    refreshToken,
    storeId: storeCredential.storeId,
    login: storeCredential.login,
    expiresIn: 15 * 60,
  };
}
```

**Пошаговый алгоритм:**
1. **Извлечение данных** из DTO
2. **Поиск учетных данных** в базе через репозиторий
3. **Проверка блокировки** аккаунта с помощью приватного метода
4. **Валидация пароля** с использованием bcrypt
5. **Обновление статистики входа** при успешной авторизации
6. **Генерация JWT токенов** с настраиваемым временем жизни
7. **Возврат ответа** с токенами и метаданными

#### 3. Метод `refreshToken()` - Обновление токенов

```typescript
async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
  try {
    // 1. Проверка токена
    const payload = this.jwtService.verify(refreshToken);
    
    // 2. Валидация пользователя
    const storeCredential = await this.authRepository.findByLogin(payload.login);
    if (!storeCredential) {
      throw new UnauthorizedException('Недействительный токен');
    }

    // 3. Генерация новых токенов
    const newPayload = {
      sub: storeCredential.id,
      storeId: storeCredential.storeId,
      login: storeCredential.login,
      type: 'store_employee',
    };

    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      storeId: storeCredential.storeId,
      login: storeCredential.login,
      expiresIn: 15 * 60,
    };
  } catch (error) {
    throw new UnauthorizedException('Недействительный refresh token');
  }
}
```

**Алгоритм обновления:**
1. **Верификация refresh токена** с помощью JwtService
2. **Повторная проверка** существования пользователя в базе
3. **Генерация новых токенов** с обновленным временем жизни
4. **Обработка ошибок** и возврат понятных сообщений

#### 4. Приватный метод `isAccountLocked()` - Проверка блокировки

```typescript
private isAccountLocked(storeCredential: StoreCredential): boolean {
  if (storeCredential.loginAttempts < this.MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  if (!storeCredential.lastFailedLogin) {
    return false;
  }

  const now = new Date();
  const lockoutEndTime = new Date(storeCredential.lastFailedLogin.getTime() + this.LOCKOUT_TIME);
  
  return now < lockoutEndTime;
}
```

**Логика проверки:**
- Если попыток меньше максимума - аккаунт не заблокирован
- Если нет записи о неудачных попытках - аккаунт не заблокирован
- Вычисляется время окончания блокировки
- Сравнивается текущее время с временем окончания блокировки

### AuthRepository - Слой доступа к данным

**Файл: `src/auth/repositories/auth.repository.ts`**

```typescript
@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(StoreCredential)
    private readonly storeCredentialRepository: Repository<StoreCredential>,
  ) {}
```

**Описание работы:**

#### 1. Инициализация
- **Внедрение зависимости**: TypeORM репозиторий для `StoreCredential`
- **Использование декоратора** `@InjectRepository` для автоматического внедрения

#### 2. Метод `findByLogin()` - Поиск по логину

```typescript
async findByLogin(login: string): Promise<StoreCredential | null> {
  return this.storeCredentialRepository.findOne({
    where: { login },
    relations: ['store'],
  });
}
```

**Функциональность:**
- Ищет единственную запись по логину
- Загружает связанную сущность `Store` через relations
- Возвращает `null` если запись не найдена
- Использует TypeORM QueryBuilder для безопасного поиска

#### 3. Метод `updateLastLogin()` - Обновление времени входа

```typescript
async updateLastLogin(id: number): Promise<void> {
  await this.storeCredentialRepository.update(id, {
    lastLogin: new Date(),
    loginAttempts: 0,
  });
}
```

**Функциональность:**
- Обновляет время последнего успешного входа
- Сбрасывает счетчик неудачных попыток в 0
- Использует операцию `update` для эффективности
- Выполняется при успешной авторизации

#### 4. Метод `incrementLoginAttempts()` - Увеличение счетчика попыток

```typescript
async incrementLoginAttempts(id: number): Promise<void> {
  await this.storeCredentialRepository.update(id, {
    loginAttempts: () => 'login_attempts + 1',
    lastFailedLogin: new Date(),
  });
}
```

**Функциональность:**
- Атомарно увеличивает счетчик попыток на 1
- Обновляет время последней неудачной попытки
- Использует SQL функцию для избежания race conditions
- Выполняется при каждой неудачной попытке входа

#### 5. Метод `resetLoginAttempts()` - Сброс счетчика

```typescript
async resetLoginAttempts(id: number): Promise<void> {
  await this.storeCredentialRepository.update(id, {
    loginAttempts: 0,
  });
}
```

**Функциональность:**
- Сбрасывает счетчик попыток входа
- Используется для ручного разблокирования аккаунта
- Может быть вызван административными функциями

### Взаимодействие компонентов

**Поток данных при авторизации:**
1. **HTTP запрос** поступает в `AuthController.login()`
2. **Контроллер** передает данные в `AuthService.login()`
3. **Сервис** обращается к `AuthRepository.findByLogin()`
4. **Репозиторий** выполняет SQL запрос и возвращает данные
5. **Сервис** проверяет пароль и генерирует токены
6. **Сервис** обновляет статистику через `AuthRepository.updateLastLogin()`
7. **Контроллер** возвращает результат клиенту

**Принципы архитектуры:**
- **Разделение ответственности**: каждый слой выполняет свою функцию
- **Внедрение зависимостей**: слабая связанность компонентов
- **Абстракция данных**: репозиторий скрывает детали работы с БД
- **Централизация бизнес-логики**: вся логика в сервисе

## Структура базы данных

### Таблица `store_credential`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | bigint | Уникальный идентификатор |
| `store_id` | bigint | ID магазина |
| `login` | text | Логин для входа (уникальный) |
| `password_hash` | text | Хэш пароля (bcrypt) |
| `created_at` | timestamp | Дата создания |
| `last_login` | timestamp | Последний успешный вход |
| `login_attempts` | integer | Количество неудачных попыток |
| `last_failed_login` | timestamp | Последняя неудачная попытка |
| `updated_at` | timestamp | Дата последнего обновления |

## API Endpoints

### POST /auth/login

Авторизация работника магазина.

**Тело запроса:**
```json
{
  "login": "store_moscow_001",
  "password": "securePassword123"
}
```

**Валидация:**
- `login`: строка, обязательное поле
- `password`: строка, минимум 6 символов, обязательное поле

**Успешный ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "storeId": 1,
  "login": "store_moscow_001",
  "expiresIn": 900
}
```

**Ошибки:**
- `401 Unauthorized`: Неверные учетные данные
- `401 Unauthorized`: Аккаунт заблокирован (превышено количество попыток)
- `400 Bad Request`: Некорректные данные в запросе

### POST /auth/refresh

Обновление access токена с помощью refresh токена.

**Тело запроса:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Успешный ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "storeId": 1,
  "login": "store_moscow_001",
  "expiresIn": 900
}
```

**Ошибки:**
- `401 Unauthorized`: Недействительный refresh токен
- `401 Unauthorized`: Токен истек

## Бизнес-логика

### Процесс авторизации

1. **Получение запроса**: Контроллер получает логин и пароль
2. **Поиск учетных данных**: Репозиторий ищет запись в БД по логину
3. **Проверка блокировки**: Сервис проверяет количество неудачных попыток
4. **Валидация пароля**: Сравнение введенного пароля с хэшем в БД
5. **Генерация токенов**: Создание JWT access и refresh токенов
6. **Обновление статистики**: Сброс счетчика попыток, обновление времени входа

### Защита от брутфорса

- **Максимум попыток**: 5 неудачных попыток входа
- **Время блокировки**: 30 минут
- **Автоматическая разблокировка**: По истечении времени блокировки
- **Сброс счетчика**: При успешном входе

### JWT Payload

```json
{
  "sub": 1,              // ID учетной записи
  "storeId": 1,          // ID магазина
  "login": "store_001",  // Логин
  "type": "store_employee", // Тип пользователя
  "iat": 1678886400,     // Время создания
  "exp": 1678887300      // Время истечения
}
```

## Использование в других модулях

### Защита маршрутов

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  // Все маршруты защищены
}
```

### Получение данных пользователя

```typescript
import { Request } from '@nestjs/common';

@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Request() req) {
  return {
    storeId: req.user.storeId,
    login: req.user.login,
    credentialId: req.user.credentialId
  };
}
```

## Конфигурация

### Переменные окружения

```env
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Значения по умолчанию

- `JWT_SECRET`: "defaultSecretKey"
- `JWT_ACCESS_EXPIRES_IN`: "15m"
- `JWT_REFRESH_EXPIRES_IN`: "7d"
- `MAX_LOGIN_ATTEMPTS`: 5
- `LOCKOUT_TIME`: 30 минут

## Сценарии использования

### Успешная авторизация

```bash
# Запрос
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "store_moscow_001",
    "password": "securePassword123"
  }'

# Ответ
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "storeId": 1,
  "login": "store_moscow_001",
  "expiresIn": 900
}
```

### Неверные учетные данные

```bash
# Запрос с неверным паролем
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "store_moscow_001",
    "password": "wrongPassword"
  }'

# Ответ
{
  "statusCode": 401,
  "message": "Неверные учетные данные"
}
```

### Блокировка аккаунта

После 5 неудачных попыток:
```bash
# Ответ
{
  "statusCode": 401,
  "message": "Аккаунт заблокирован из-за превышения попыток входа"
}
```

### Обновление токенов

```bash
# Запрос
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Ответ
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "storeId": 1,
  "login": "store_moscow_001",
  "expiresIn": 900
}
```

## Безопасность

### Хеширование паролей

- Используется библиотека `bcrypt`
- Автоматическая генерация соли
- Стойкость к rainbow table атакам

### JWT токены

- Подписываются секретным ключом
- Содержат время истечения
- Включают только необходимые данные

### Защита от атак

- **Брутфорс**: Временная блокировка аккаунта
- **Replay attacks**: Короткое время жизни access токенов
- **Token theft**: Возможность обновления токенов

## Мониторинг и логирование

### Отслеживаемые события

- Успешные входы в систему
- Неудачные попытки входа
- Блокировки аккаунтов
- Использование refresh токенов

### Метрики

- Количество неудачных попыток входа
- Время последнего входа
- Частота использования refresh токенов

## Расширение функциональности

### Добавление ролей

```typescript
// В payload JWT можно добавить роли
const payload = {
  sub: storeCredential.id,
  storeId: storeCredential.storeId,
  login: storeCredential.login,
  type: 'store_employee',
  roles: ['cashier', 'manager'] // Новое поле
};
```

### Многофакторная аутентификация

```typescript
// Можно расширить для поддержки 2FA
export class LoginDto {
  login: string;
  password: string;
  twoFactorCode?: string; // Опциональный код
}
```

### Сессии и logout

```typescript
// Добавить сохранение активных сессий
@Entity('active_sessions')
export class ActiveSession {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  credentialId: number;
  
  @Column()
  refreshToken: string;
  
  @Column()
  expiresAt: Date;
}
```

## Тестирование

### Примеры тестов

```typescript
describe('AuthService', () => {
  it('should login with valid credentials', async () => {
    const result = await authService.login({
      login: 'store_001',
      password: 'password123'
    });
    
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.storeId).toBe(1);
  });
  
  it('should block account after 5 failed attempts', async () => {
    // Имитация 5 неудачных попыток
    for (let i = 0; i < 5; i++) {
      await authService.login({
        login: 'store_001',
        password: 'wrong_password'
      }).catch(() => {});
    }
    
    await expect(authService.login({
      login: 'store_001',
      password: 'wrong_password'
    })).rejects.toThrow('Аккаунт заблокирован');
  });
});
```

## Заключение

Модуль авторизации предоставляет простую и безопасную систему аутентификации для работников магазинов. Он обеспечивает необходимый уровень безопасности с помощью JWT токенов, защиты от брутфорса и хеширования паролей. Модуль легко расширяется для добавления новых функций, таких как роли, многофакторная аутентификация или управление сессиями.
