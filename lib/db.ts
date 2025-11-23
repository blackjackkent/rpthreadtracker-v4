import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

function parseConnectionString(connectionString: string): sql.config {
  // Check if it's a LocalDB connection string
  if (connectionString.includes('(localdb)')) {
    // Extract the LocalDB instance name
    const instanceMatch = connectionString.match(/Data Source=\(localdb\)\\([^;]+)/i);
    const databaseMatch = connectionString.match(/Initial Catalog=([^;]+)/i);
    const integratedSecurityMatch = connectionString.match(/Integrated Security=([^;]+)/i);

    // For LocalDB with Tedious driver, we need to use localhost or .
    // Get the instance name
    const instanceName = instanceMatch ? instanceMatch[1] : 'MSSQLLocalDB';

    const config: sql.config = {
      // Use localhost with instance name in options
      server: 'localhost',
      database: databaseMatch ? databaseMatch[1] : '',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: instanceName,
        // Use port 1433 by default, but instance name should override
        port: undefined,
      },
    };

    return config;
  } else {
    // For regular SQL Server connections, parse the connection string
    const serverMatch = connectionString.match(/Server=([^;]+)/i);
    const databaseMatch = connectionString.match(/(?:Initial Catalog|Database)=([^;]+)/i);
    const userIdMatch = connectionString.match(/User I[dD]=([^;]+)/i);
    const passwordMatch = connectionString.match(/Password=([^;]+)/i);
    const integratedSecurityMatch = connectionString.match(/Integrated Security=([^;]+)/i);
    const encryptMatch = connectionString.match(/Encrypt=([^;]+)/i);
    const trustServerCertMatch = connectionString.match(/TrustServerCertificate=([^;]+)/i);

    // Parse server, port, and instance name
    let server = serverMatch ? serverMatch[1] : '';
    let instanceName: string | undefined;
    let port: number | undefined;

    // Remove tcp: prefix if present (Azure SQL format)
    if (server.toLowerCase().startsWith('tcp:')) {
      server = server.substring(4);
    }

    // Check if server contains port (server,port)
    const portSplit = server.split(',');
    if (portSplit.length > 1) {
      server = portSplit[0];
      port = parseInt(portSplit[1], 10);
    } else {
      // Check if server contains instance name (server\instance or server\\instance)
      const instanceSplit = server.split('\\');
      if (instanceSplit.length > 1) {
        server = instanceSplit[0];
        instanceName = instanceSplit[instanceSplit.length - 1];
      }
    }

    const config: sql.config = {
      server: server,
      database: databaseMatch ? databaseMatch[1] : '',
      ...(port && { port }),
      options: {
        encrypt: encryptMatch ? encryptMatch[1].toLowerCase() === 'true' : false,
        trustServerCertificate: trustServerCertMatch ? trustServerCertMatch[1].toLowerCase() === 'true' : false,
        enableArithAbort: true,
        ...(instanceName && { instanceName }),
      },
    };

    // Use SQL authentication if user/password provided, otherwise Windows authentication
    if (userIdMatch && passwordMatch) {
      config.user = userIdMatch[1];
      config.password = passwordMatch[1];
    }
    // If Integrated Security is true, don't set user/password (uses Windows auth)
    // This is the default if user/password are not specified

    return config;
  }
}

export async function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const config = parseConnectionString(connectionString);
    pool = await sql.connect(config);
  }
  return pool;
}

export interface AspNetUser {
  Id: string;
  UserName: string;
  Email: string;
  NormalizedEmail: string;
  NormalizedUserName: string;
  PasswordHash: string;
  EmailConfirmed: boolean;
  LockoutEnabled: boolean;
  LockoutEnd: Date | null;
  AccessFailedCount: number;
  TwoFactorEnabled: boolean;
  SecurityStamp: string;
  ConcurrencyStamp: string;
  PhoneNumber: string | null;
  PhoneNumberConfirmed: boolean;
}

export async function getUserByEmail(email: string): Promise<AspNetUser | null> {
  const db = await getDb();
  const result = await db
    .request()
    .input('email', sql.NVarChar, email.toUpperCase())
    .query('SELECT * FROM dbo.AspNetUsers WHERE NormalizedEmail = @email');

  return result.recordset[0] || null;
}

export async function getUserByUsername(username: string): Promise<AspNetUser | null> {
  const db = await getDb();
  const result = await db
    .request()
    .input('username', sql.NVarChar, username.toUpperCase())
    .query('SELECT * FROM dbo.AspNetUsers WHERE NormalizedUserName = @username');

  return result.recordset[0] || null;
}

export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
  const db = await getDb();
  await db
    .request()
    .input('userId', sql.NVarChar, userId)
    .input('passwordHash', sql.NVarChar, newPasswordHash)
    .query('UPDATE dbo.AspNetUsers SET PasswordHash = @passwordHash WHERE Id = @userId');
}
