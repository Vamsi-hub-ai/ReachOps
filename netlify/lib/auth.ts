import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

export interface AuthContext {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  workspaceId: string;
  workspaceIds: string[];
  workspaceName?: string;
  isDemo: boolean;
}

export function isWorkspaceDemo(workspaceId: string, workspaceName?: string | null): boolean {
  if (!workspaceId) return false;
  if (workspaceId === 'demo-workspace-id' || workspaceId.startsWith('demo-')) return true;
  if (workspaceName && workspaceName.toLowerCase().includes('demo')) return true;
  return false;
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return {
    statusCode: 403,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

/**
 * Extracts and strictly verifies the authenticated user from the session cookie.
 * Returns null if the session cookie is missing, expired, invalid, or if the user/workspace does not exist.
 * Never falls back to a default user or bypasses verification.
 */
export async function getAuthContext(event: any): Promise<AuthContext | null> {
  const cookieHeader = event?.headers?.cookie || event?.headers?.Cookie || '';
  const cookies = cookie.parse(cookieHeader);
  const token = cookies.session;

  if (!token) {
    return null;
  }

  const secret = process.env.SESSION_SECRET || 'fallback-secret-key';

  try {
    const decoded = jwt.verify(token, secret) as { userId?: string; email?: string };
    if (!decoded || typeof decoded.userId !== 'string' || !decoded.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        workspaceMembers: {
          select: {
            workspaceId: true,
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const workspaceMembers = user.workspaceMembers || [];
    const workspaceIds = workspaceMembers.map((m: any) => m.workspaceId).filter(Boolean);

    if (workspaceIds.length === 0) {
      // User is not a member of any valid workspace
      return null;
    }

    const primaryWorkspace = workspaceMembers[0]?.workspace;
    const workspaceName = primaryWorkspace?.name || 'Workspace';
    const isDemo = user.email.toLowerCase() === 'demo@reachops.com' ||
                   workspaceIds.some(id => isWorkspaceDemo(id)) ||
                   isWorkspaceDemo(workspaceIds[0], workspaceName);

    return {
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      workspaceId: workspaceIds[0],
      workspaceIds,
      workspaceName,
      isDemo,
    };
  } catch (err) {
    // JWT verification failed (e.g., TokenExpiredError, JsonWebTokenError)
    return null;
  }
}
