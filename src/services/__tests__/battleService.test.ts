import { updateRating } from '../battleService';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    functions: {
      invoke: jest.fn(),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
    })),
    removeChannel: jest.fn(),
  },
}));

describe('updateRating', () => {
  const { supabase } = require('../supabase');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('increases rating on win against equal opponent', async () => {
    // Mock user fetch
    const mockSingle = jest.fn().mockResolvedValue({ data: { rating: 1000 } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockUpdateEq = jest.fn().mockResolvedValue({});
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return { select: mockSelect, update: mockUpdate };
      }
      return {};
    });

    const newRating = await updateRating('user-1', 1000, true);

    // Win vs equal = +16 (K=32, expected=0.5, change=32*(1-0.5)=16)
    expect(newRating).toBe(1016);
  });

  test('decreases rating on loss against equal opponent', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: { rating: 1000 } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockUpdateEq = jest.fn().mockResolvedValue({});
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return { select: mockSelect, update: mockUpdate };
      }
      return {};
    });

    const newRating = await updateRating('user-1', 1000, false);

    // Loss vs equal = -16
    expect(newRating).toBe(984);
  });

  test('gains more rating when beating higher-rated opponent', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: { rating: 1000 } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockUpdateEq = jest.fn().mockResolvedValue({});
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return { select: mockSelect, update: mockUpdate };
      }
      return {};
    });

    const newRating = await updateRating('user-1', 1400, true);

    // Beating someone 400 points higher should give more than 16
    expect(newRating).toBeGreaterThan(1016);
  });

  test('rating floor is 0', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: { rating: 10 } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockUpdateEq = jest.fn().mockResolvedValue({});
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return { select: mockSelect, update: mockUpdate };
      }
      return {};
    });

    const newRating = await updateRating('user-1', 1000, false);

    expect(newRating).toBeGreaterThanOrEqual(0);
  });

  test('returns null when user not found', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await updateRating('nonexistent', 1000, true);
    expect(result).toBeNull();
  });
});
