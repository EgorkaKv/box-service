import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Customer} from '../entities/customer.entity';
import {AppLogger} from '@common/logger/app-logger.service';
import {CustomerRegisterDto} from "@auth/dto/customer-register.dto";

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Найти клиента по номеру телефона
   */
  async findByPhone(phone: string): Promise<Customer | null> {
    this.logger.debug('Finding customer by phone', 'CustomerRepository', { phone });

    const customer = await this.customerRepository.findOne({
      where: { phone },
    });

    this.logger.debug('Customer search by phone completed', 'CustomerRepository', {
      phone,
      found: !!customer,
      customerId: customer?.id
    });

    return customer;
  }

  /**
   * Найти клиента по email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    this.logger.debug('Finding customer by email', 'CustomerRepository', { email });

    const customer = await this.customerRepository.findOne({
      where: { email },
    });

    this.logger.debug('Customer search by email completed', 'CustomerRepository', {
      email,
      found: !!customer,
      customerId: customer?.id
    });

    return customer;
  }

  /**
   * Найти клиента по ID
   */
  async findById(id: number): Promise<Customer | null> {
    this.logger.debug('Finding customer by ID', 'CustomerRepository', { id });

    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    this.logger.debug('Customer search by ID completed', 'CustomerRepository', {
      id,
      found: !!customer
    });

    return customer;
  }

  /**
   * Создать клиента с номером телефона
   */
  async createWithPhone(phone: string): Promise<Customer> {
    this.logger.debug('Creating customer with phone', 'CustomerRepository', { phone });

    const customer = this.customerRepository.create({
      phone,
      customerName: `Customer ${phone}`, // Временное имя, можно будет изменить позже
      lastLogin: new Date(),
    });

    const savedCustomer = await this.customerRepository.save(customer);

    this.logger.debug('Customer created with phone', 'CustomerRepository', {
      phone,
      customerId: savedCustomer.id
    });

    return savedCustomer;
  }

  /**
   * Создать клиента с email
   */
  async createWithEmail(email: string): Promise<Customer> {
    this.logger.debug('Creating customer with email', 'CustomerRepository', { email });

    const customer = this.customerRepository.create({
      email,
      customerName: `Customer ${email}`, // Временное имя, можно будет изменить позже
      lastLogin: new Date(),
    });

    const savedCustomer = await this.customerRepository.save(customer);

    this.logger.debug('Customer created with email', 'CustomerRepository', {
      email,
      customerId: savedCustomer.id
    });

    return savedCustomer;
  }

  async validatePassword(id: number, password: string): Promise<boolean> {
    this.logger.debug('Validating customer password', 'CustomerRepository', { id });

    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      this.logger.debug('Customer not found during password validation', 'CustomerRepository', { id });
      return false;
    }

    // проверяем хеши паролей
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(password, customer.passwordHash);


    this.logger.debug('Customer password validation completed', 'CustomerRepository', {
      id,
      isMatch
    });

    return isMatch
  }

  /**
   * Обновить время последнего входа
   */
  async updateLastLogin(id: number): Promise<void> {
    this.logger.debug('Updating last login for customer', 'CustomerRepository', { id });

    await this.customerRepository.update(id, {
      lastLogin: new Date(),
    });

    this.logger.debug('Last login updated for customer', 'CustomerRepository', { id });
  }

  /**
   * Создать клиента с email и паролем
   * @param registerDto
   * @param passwordHash
   */
  async createWithEmailAndPassword(registerDto: CustomerRegisterDto, passwordHash: string): Promise<Customer> {
    this.logger.debug('Creating customer with email and password', 'CustomerRepository', { email: registerDto.email });

    const customer = this.customerRepository.create({
      email: registerDto.email,
      passwordHash: passwordHash,
      customerName: registerDto.customerName ?? `Customer ${registerDto.email}`,
      // FIXME: исправить добавление необязательных полей
      // ...(registerDto.customerName && { customerName: registerDto.customerName }),
      // gender: registerDto?.gender,
      // ...(registerDto.profileImageUrl && { profileImageUrl: registerDto.profileImageUrl }),
      lastLogin: new Date(),
    });

    const savedCustomer = await this.customerRepository.save(customer);

    this.logger.debug('Customer created with email and password', 'CustomerRepository', {
      email: registerDto.email,
      customerId: savedCustomer.id
    });

    return savedCustomer;
  }

  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
}
