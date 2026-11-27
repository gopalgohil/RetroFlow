import jwt from 'jsonwebtoken';

// Public signing certificates for Firebase Auth ID tokens.
const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const getFirebaseProjectId = () =>
  (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'retroflow-1d442').trim();

let cachedCerts = null;
let certsExpireAt = 0;

const fetchFirebaseCerts = async () => {
  if (cachedCerts && Date.now() < certsExpireAt) {
    return cachedCerts;
  }

  const res = await fetch(FIREBASE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Unable to fetch Firebase signing certificates (status ${res.status})`);
  }

  const certs = await res.json();
  const maxAgeMatch = (res.headers.get('cache-control') || '').match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 60 * 60 * 1000;

  cachedCerts = certs;
  certsExpireAt = Date.now() + maxAgeMs;
  return certs;
};

/**
 * Verifies a Firebase Auth ID token and returns its decoded payload.
 * Throws if the token is missing, forged, expired or issued for another project.
 */
export const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Firebase ID token is missing.');
  }

  const decodedHeader = jwt.decode(idToken, { complete: true });
  const kid = decodedHeader?.header?.kid;
  if (!kid || decodedHeader.header.alg !== 'RS256') {
    throw new Error('Firebase ID token has an invalid header.');
  }

  const certs = await fetchFirebaseCerts();
  const cert = certs[kid];
  if (!cert) {
    throw new Error('Firebase ID token was signed with an unknown key.');
  }

  const projectId = getFirebaseProjectId();
  const payload = jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  if (!payload.sub) {
    throw new Error('Firebase ID token has no subject.');
  }

  return payload;
};

export default verifyFirebaseIdToken;
