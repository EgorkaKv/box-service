import { Injectable } from '@nestjs/common';
import { BaseMapper } from '@common/mapper/base.mapper';
import {Payment, PaymentMethod} from '@order/entities/payment.entity';

/**
 * DTO для представления платежа в ответе заказа
 */
export interface OrderPaymentDto {
  id: number;
  paymentMethod: string;
  amount: number;
  currency: string;
  transactionId?: string;
}

/**
 * Маппер для Payment в контексте заказа
 */
@Injectable()
export class PaymentMapper extends BaseMapper<Payment, OrderPaymentDto> {

  toDto(payment: Payment): OrderPaymentDto {
    return {
      id: payment.id,
      paymentMethod: this.safeGet(payment.paymentMethod, PaymentMethod.APP),
      amount: this.safeGet(payment.amount, 0),
      currency: this.safeGet(payment.currency, 'USD'),
      transactionId: payment.transactionId,
    };
  }
}
