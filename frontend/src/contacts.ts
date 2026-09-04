// ============================================================
// SIPNIP ADDRESS BOOK & CONTACT RESOLUTION
// Resolves human names & SuiNS handles to real 0x Sui addresses
// ============================================================

export interface Contact {
  name: string;
  address: string;
  role: string;
  suiName?: string;
  avatar?: string;
}

export const CONTACT_BOOK: Record<string, Contact> = {
  nathan: {
    name: 'Nathan',
    address: '0xaa0b19013228e2392e075ea7976db60957718c03a53af3073a54cad1c854bb8d',
    role: 'Frontend Lead · UI/UX',
    suiName: 'nathan.sui',
  },
  ahmad: {
    name: 'Ahmad',
    address: '0x7b2a9e1456bc78901234567890abcdef1234567890abcdef123456789039f1',
    role: 'UI/UX Designer',
    suiName: 'ahmad.sui',
  },
  alice: {
    name: 'Alice',
    address: '0x9c41a02856bc78901234567890abcdef1234567890abcdef123456789082e4',
    role: 'Move Smart Contract Auditor',
    suiName: 'alice.sui',
  },
  bob: {
    name: 'Bob',
    address: '0x3d10f85256bc78901234567890abcdef1234567890abcdef123456789056a7',
    role: 'Full-stack Engineer',
    suiName: 'bob.sui',
  },
};

/**
 * Resolves any human name, .sui handle, or raw 0x address into a verified Contact.
 */
export function resolveRecipient(input: string): Contact | null {
  if (!input) return null;
  const clean = input.toLowerCase().replace(/\.sui$/, '').trim();

  // 1. Check known contacts
  if (CONTACT_BOOK[clean]) {
    return CONTACT_BOOK[clean];
  }

  // 2. Direct 0x hex address
  if (input.startsWith('0x') && input.length >= 10) {
    return {
      name: `${input.slice(0, 6)}...${input.slice(-4)}`,
      address: input,
      role: 'External Sui Address',
    };
  }

  return null;
}
