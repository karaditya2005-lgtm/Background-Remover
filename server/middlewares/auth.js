// middlewares/auth.js
const authUser = async (req, res, next) => {
    try {
        console.log('🔐 Auth middleware hit');
        
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No Bearer token');
            return res.json({ success: false, message: 'Not Authorized. Please Login.' });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.split(' ')[1];

        if (!token) {
            console.log('❌ Token empty');
            return res.json({ success: false, message: 'Not Authorized. Please Login.' });
        }

        console.log('🎫 Token received (first 20 chars):', token.substring(0, 20) + '...');

        // Decode the Clerk token
        try {
            const base64Payload = token.split('.')[1];
            const decoded = JSON.parse(
                Buffer.from(base64Payload, 'base64').toString()
            );
            
            console.log('📦 Decoded token:', decoded);
            
            // Clerk uses 'sub' for user ID
            const clerkId = decoded.sub || decoded.userId || decoded.clerk_id;
            
            console.log('👤 Extracted clerkId:', clerkId);
            
            if (!clerkId) {
                console.log('❌ ClerkId not found in token');
                return res.json({ success: false, message: 'Invalid token format' });
            }
            
            // ⭐ Store clerkId in req.body (this survives through all middlewares)
            req.body.clerkId = clerkId;
            
            console.log('✅ Auth successful, clerkId set in req.body:', clerkId);
            next();
            
        } catch (decodeError) {
            console.error('❌ Token decode error:', decodeError.message);
            return res.json({ success: false, message: 'Invalid token format' });
        }
        
    } catch(error) {
        console.error('❌ Auth error:', error.message);
        res.json({ success: false, message: 'Invalid token. Please login again.' });
    }
};

export default authUser;