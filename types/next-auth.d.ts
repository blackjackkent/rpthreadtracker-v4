import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    emailVerified: boolean;
  }
}
