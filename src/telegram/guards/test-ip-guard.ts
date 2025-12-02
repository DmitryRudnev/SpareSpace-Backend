import { Address4, Address6 } from 'ip-address';

function testIPValidation() {
  const testCases = [
    // IPv4 тесты
    { ip: '91.108.56.25', cidr: '91.108.56.0/22', expected: true },
    { ip: '8.8.8.8', cidr: '91.108.56.0/22', expected: false },
    { ip: '149.154.160.100', cidr: '149.154.160.0/20', expected: true },
    
    // IPv6 тесты  
    { ip: '2001:b28:f23d::1', cidr: '2001:b28:f23d::/48', expected: true },
    { ip: '2001:b28:f23f::1', cidr: '2001:b28:f23d::/48', expected: false },
    { ip: '2a0a:f280::1', cidr: '2a0a:f280::/32', expected: true },
  ];

  testCases.forEach(({ ip, cidr, expected }) => {
    const result = isIPInCIDR(ip, cidr);
    console.log(`${ip} in ${cidr} -> ${result} (expected: ${expected}) ${result === expected ? '✅' : '❌'}`);
  });
}

function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    if (cidr.includes(':')) {
      if (!Address6.isValid(ip) || !Address6.isValid(cidr)) return false;
      const address = new Address6(ip);
      const subnet = new Address6(cidr);
      return address.isInSubnet(subnet);
    } else {
      if (!Address4.isValid(ip) || !Address4.isValid(cidr)) return false;
      const address = new Address4(ip);
      const subnet = new Address4(cidr);
      return address.isInSubnet(subnet);
    }
  } catch {
    return false;
  }
}

// Запуск теста
testIPValidation();
