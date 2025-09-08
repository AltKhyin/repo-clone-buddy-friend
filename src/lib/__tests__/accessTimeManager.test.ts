// ABOUTME: Tests for access time management ensuring overdue scenarios work correctly

import { describe, it, expect } from 'vitest';
import { 
  calculateAccessTimeFromPayment, 
  determineUserTier, 
  calculateRemainingDays 
} from '../accessTimeManager';

describe('Access Time Manager', () => {
  describe('calculateAccessTimeFromPayment', () => {
    it('should add FULL time for overdue user (key requirement)', () => {
      // User is 10 days overdue (currentEndDate is in the past)
      const currentEndDate = '2024-01-01T00:00:00.000Z'; // Past date (overdue)
      const planDays = 365; // 1 year plan
      const paymentDate = new Date('2024-01-11T10:00:00.000Z'); // 10 days after expiry

      const result = calculateAccessTimeFromPayment(currentEndDate, planDays, paymentDate);

      // Should get FULL 365 days from payment date (not deducting overdue days)
      const expectedEndDate = new Date(paymentDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 365);

      expect(result.newEndDate).toBe(expectedEndDate.toISOString());
      expect(result.newTier).toBe('premium');
      expect(result.shouldUpgrade).toBe(true);
      expect(result.daysAdded).toBe(365);
    });

    it('should extend existing active access correctly', () => {
      // User has 30 days of active access remaining
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const currentEndDate = futureDate.toISOString();
      
      const planDays = 365;
      const paymentDate = new Date();

      const result = calculateAccessTimeFromPayment(currentEndDate, planDays, paymentDate);

      // Should add 365 days to existing 30 days (total 395 days from now)
      const expectedEndDate = new Date(futureDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 365);

      expect(result.newEndDate).toBe(expectedEndDate.toISOString());
      expect(result.newTier).toBe('premium');
      expect(result.daysAdded).toBe(365);
    });

    it('should create new access for user with no existing access', () => {
      const currentEndDate = null; // No existing access
      const planDays = 30;
      const paymentDate = new Date();

      const result = calculateAccessTimeFromPayment(currentEndDate, planDays, paymentDate);

      const expectedEndDate = new Date(paymentDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 30);

      expect(result.newEndDate).toBe(expectedEndDate.toISOString());
      expect(result.newTier).toBe('premium');
      expect(result.shouldUpgrade).toBe(true);
      expect(result.daysAdded).toBe(30);
    });
  });

  describe('determineUserTier', () => {
    it('should return premium for future end date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const tier = determineUserTier(futureDate.toISOString());
      expect(tier).toBe('premium');
    });

    it('should return free for past end date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      const tier = determineUserTier(pastDate.toISOString());
      expect(tier).toBe('free');
    });

    it('should return free for null end date', () => {
      const tier = determineUserTier(null);
      expect(tier).toBe('free');
    });
  });

  describe('calculateRemainingDays', () => {
    it('should calculate positive days for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const remainingDays = calculateRemainingDays(futureDate.toISOString());
      expect(remainingDays).toBe(5);
    });

    it('should calculate negative days for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      
      const remainingDays = calculateRemainingDays(pastDate.toISOString());
      expect(remainingDays).toBe(-3);
    });

    it('should return null for null end date', () => {
      const remainingDays = calculateRemainingDays(null);
      expect(remainingDays).toBe(null);
    });
  });
});