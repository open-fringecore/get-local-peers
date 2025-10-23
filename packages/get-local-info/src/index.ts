import * as os from "os";

const getHostname = (): string => {
    return os.hostname();
};

// Private IP ranges according to RFC 1918
const PRIVATE_IP_RANGES = [
    { prefix: "10.", mask: "255.0.0.0" },
    { prefix: "172.16.", mask: "255.240.0.0" }, // 172.16.0.0 - 172.31.255.255
    { prefix: "192.168.", mask: "255.255.0.0" },
] as const;

// Checks if an IP address is within private ranges (RFC 1918)
const isPrivateIP = (ip: string): boolean => {
    // Check 192.168.x.x
    if (ip.startsWith("192.168.")) return true;

    // Check 10.x.x.x
    if (ip.startsWith("10.")) return true;

    // Check 172.16.x.x - 172.31.x.x
    if (ip.startsWith("172.")) {
        const secondOctet = parseInt(ip.split(".")[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }

    return false;
};

// Converts an IP address string to a 32-bit number
const ipToNumber = (ip: string): number => {
    return (
        ip
            .split(".")
            .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    );
};

// Converts a 32-bit number to an IP address string
const numberToIp = (num: number): string => {
    return [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8) & 0xff,
        num & 0xff,
    ].join(".");
};

// Calculates the broadcast address for a given IP and subnet mask
const calculateBroadcastAddress = (
    ipAddress: string,
    subnetMask: string
): string => {
    const ipNum = ipToNumber(ipAddress);
    const maskNum = ipToNumber(subnetMask);

    const broadcastNum = (ipNum | ~maskNum) >>> 0;

    return numberToIp(broadcastNum);
};

interface NetworkInfo {
    address: string | null;
    subnetMask: string | null;
    addresses: string[];
}

const getLocalIP = (): NetworkInfo => {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];
    let address: string | null = null;
    let subnetMask: string | null = null;

    for (const iface of Object.values(interfaces)) {
        if (!iface) continue;

        for (const details of iface) {
            if (details.family !== "IPv4" || details.internal) continue;

            addresses.push(details.address);

            // Prioritize private IPs and only set once
            if (!address && isPrivateIP(details.address)) {
                address = details.address;
                subnetMask = details.netmask;
            }
        }
    }

    return {
        address,
        subnetMask,
        addresses,
    };
};

type LocalInfo = { hostname: string; ip: string; broadcast: string } | null;

const getLocalInfo = (): LocalInfo => {
    const { address, subnetMask } = getLocalIP();

    if (!address || !subnetMask) {
        return null;
    }

    const broadcastAddress = calculateBroadcastAddress(address, subnetMask);
    const hostname = getHostname();
    return { hostname, ip: address, broadcast: broadcastAddress };
};

export default getLocalInfo;
export { getLocalIP, calculateBroadcastAddress, isPrivateIP, getHostname };
